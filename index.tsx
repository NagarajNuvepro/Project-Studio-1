/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { marked } from "marked";
import { API_KEY } from "./config.js";

// --- TYPE DEFINITIONS ---
type ExperienceLevel = "Beginner" | "Intermediate" | "Advanced";
type Step = "initial" | "clarification" | "suggestion" | "refining" | "final";
type ChatMessage = {
  role: "user" | "ai" | "system";
  content: string;
};
type ReferenceDoc = {
  name: string;
  mimeType: string;
  base64Data: string;
};
type FormData = {
  projectName: string;
  skills: string;
  experience: ExperienceLevel;
  referenceUrl: string;
  referenceDoc: ReferenceDoc | null;
};

// --- ICONS (as React Components) ---
const BotIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
  >
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </svg>
);

const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SendIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

const DownloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4 mr-2"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4 mr-2"
  >
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

const RestartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4 mr-2"
  >
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M21 21v-5h-5" />
  </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M20 6 9 17l-5-5"/></svg>
)


// --- Main App Component ---
function App() {
  if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
    return (
      <div className="w-full h-full flex items-center justify-center">
         <div className="w-full max-w-lg mx-auto text-center p-8 bg-zinc-900 border border-orange-500 rounded-xl">
          <h1 className="text-2xl font-bold text-orange-400 mb-4">Configuration Required</h1>
          <p className="text-zinc-300 mb-4">
            To get started, please add your Google Gemini API key to the project.
          </p>
          <p className="text-zinc-400 text-sm">
             Create a file named <code>config.js</code> and add your key like this:
          </p>
          <pre className="text-left bg-zinc-800 p-4 rounded-md mt-4 text-sm text-zinc-400 overflow-x-auto">
            <code className="whitespace-pre-wrap">
              // In config.js<br/>
              export const API_KEY = "PASTE_YOUR_GEMINI_API_KEY_HERE";
            </code>
          </pre>
           <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="inline-block mt-6 text-orange-400 hover:text-orange-300 underline">
            Get your API Key from Google AI Studio &rarr;
          </a>
        </div>
      </div>
    );
  }
  
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const [step, setStep] = useState<Step>("initial");
  const [formData, setFormData] = useState<FormData>({
    projectName: "",
    skills: "",
    experience: "Beginner",
    referenceUrl: "",
    referenceDoc: null,
  });
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [projectSuggestion, setProjectSuggestion] = useState("");
  const [finalProposal, setFinalProposal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clarificationCount, setClarificationCount] = useState(0);

  const resetState = () => {
    setStep("initial");
    setFormData({
      projectName: "",
      skills: "",
      experience: "Beginner",
      referenceUrl: "",
      referenceDoc: null,
    });
    setChatHistory([]);
    setProjectSuggestion("");
    setFinalProposal("");
    setIsLoading(false);
    setError(null);
    setClarificationCount(0);
  };

  const handleError = (message: string) => {
    setError(message);
    setIsLoading(false);
  };

  const handleStartForging = async () => {
    if (!formData.projectName || !formData.skills) {
      handleError("Project Name and Skills to Learn are required.");
      return;
    }
    setError(null);
    setIsLoading(true);
    setStep("clarification");

    const initialPrompt = `You are an expert project manager AI. Your goal is to help a user define a project.
User's initial idea:
- Project Name: ${formData.projectName}
- Skills to Learn: ${formData.skills}
- Experience Level: ${formData.experience}
${formData.referenceUrl ? `- Reference URL: ${formData.referenceUrl}` : ''}
${formData.referenceDoc ? `- Reference Document: ${formData.referenceDoc.name}` : ''}

Analyze this information. If you have enough details to propose a project plan, respond ONLY with the exact text "CLARIFICATION_COMPLETE".
If not, ask one single, concise clarifying question to better understand the user's needs. Do not greet the user, just ask the question.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: initialPrompt,
      });

      const text = response.text.trim();
      if (text === "CLARIFICATION_COMPLETE") {
        await suggestProject();
      } else {
        setChatHistory([{ role: "ai", content: text }]);
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      handleError("Failed to start the clarification process. Please try again.");
    }
  };
  
  const handleUserResponse = async (userMessage: string) => {
    setIsLoading(true);
    const updatedHistory: ChatMessage[] = [...chatHistory, { role: "user", content: userMessage }];
    setChatHistory(updatedHistory);

    if (clarificationCount >= 2) { // Max 3 questions
        await suggestProject(updatedHistory);
        return;
    }

    const clarificationPrompt = `You are an expert project manager AI. Continue the conversation to clarify project requirements.
Conversation History:
${updatedHistory.map(m => `${m.role === 'ai' ? 'AI' : 'User'}: ${m.content}`).join('\n')}

Based on the conversation, determine if you have enough information to propose a project plan.
If you have enough, respond ONLY with the exact text "CLARIFICATION_COMPLETE".
If not, ask one more single, concise clarifying question.`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: clarificationPrompt,
        });
        const text = response.text.trim();
        
        if (text === "CLARIFICATION_COMPLETE") {
            await suggestProject(updatedHistory);
        } else {
            setChatHistory(prev => [...prev, { role: "ai", content: text }]);
            setClarificationCount(prev => prev + 1);
            setIsLoading(false);
        }

    } catch (err) {
        console.error(err);
        handleError("Failed to get clarification. Please try again.");
    }
  };

  const suggestProject = async (currentChatHistory = chatHistory) => {
    setIsLoading(true);
    setStep("suggestion");
    setChatHistory(prev => [...prev, { role: 'system', content: "I'm crafting a project suggestion..." }]);

    const parts: any[] = [];
    let prompt;

    if (formData.referenceUrl) {
        prompt = `You are an expert project manager. A user provided a reference URL: ${formData.referenceUrl}.
Using Google Search to analyze its content, identify the "Introduction" and "Table of Contents" (or similar sections).
Based ONLY on those sections, generate a project suggestion. If you cannot access the URL or find those sections, ignore the URL and use the other user inputs.
The suggestion must be in Markdown format and include these sections: "Project Overview", "Key Features", and "Tech Stack".
Other user inputs:
- Project Name: ${formData.projectName}
- Skills to Learn: ${formData.skills}
- Experience Level: ${formData.experience}`;
    } else {
        prompt = `You are an expert project manager. Based on the user's inputs and our conversation, generate a project suggestion.
Inputs:
- Project Name: ${formData.projectName}
- Skills to Learn: ${formData.skills}
- Experience Level: ${formData.experience}
Conversation History:
${currentChatHistory.filter(m => m.role !== 'system').map(m => `${m.role === 'ai' ? 'AI' : 'User'}: ${m.content}`).join('\n')}
The suggestion must be in Markdown format and include these sections: "Project Overview", "Key Features", and "Tech Stack".`;
        if (formData.referenceDoc) {
          parts.push({
            inlineData: {
              mimeType: formData.referenceDoc.mimeType,
              data: formData.referenceDoc.base64Data,
            },
          });
          prompt += `\nAn additional reference document was provided. Use its contents to inform the suggestion.`;
        }
    }
    parts.push({ text: prompt });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts },
            config: {
                tools: formData.referenceUrl ? [{googleSearch: {}}] : [],
            },
        });
        const suggestion = response.text;
        setProjectSuggestion(suggestion);
    } catch(err) {
        console.error(err);
        handleError("Failed to generate project suggestion.");
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleRefineSuggestion = async (refinementRequest: string) => {
    setIsLoading(true);
    setStep("suggestion"); // Stay on suggestion step, but show loading
    setChatHistory(prev => [
        ...prev, 
        { role: 'user', content: `Change request: ${refinementRequest}` },
        { role: 'system', content: "I'm refining the suggestion..." }
    ]);

    const prompt = `You are an expert project manager. You previously made this project suggestion:
---
${projectSuggestion}
---
The user has requested the following changes: "${refinementRequest}".
Please generate a new, complete project suggestion in Markdown that incorporates this feedback. The new suggestion must still include "Project Overview", "Key Features", and "Tech Stack" sections.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      setProjectSuggestion(response.text);
    } catch (err) {
      console.error(err);
      handleError("Failed to refine the suggestion.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveSuggestion = async () => {
    setIsLoading(true);
    setStep("final");

    const prompt = `You are an expert project manager. Expand the following approved project suggestion into a final, detailed project proposal document.
The proposal must be in Markdown and be well-structured with these sections:
1.  **Executive Summary**: A brief, high-level overview.
2.  **Project Goals and Objectives**: What the project aims to achieve.
3.  **Scope of Work**: Detail all key features.
4.  **Target Audience**: Who is this project for?
5.  **Tech Stack & Architecture**: Recommended technologies and why.
6.  **Project Timeline/Roadmap**: A phased plan (e.g., Phase 1: Setup, Phase 2: Core Features).
7.  **Potential Risks and Mitigation**: Identify possible challenges.
8.  **Success Metrics**: How to measure project success.

Approved Suggestion:
---
${projectSuggestion}
---`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      setFinalProposal(response.text);
    } catch (err) {
      console.error(err);
      handleError("Failed to generate the final proposal.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderStep = () => {
    switch(step) {
      case "initial":
        return <InitialScreen formData={formData} setFormData={setFormData} onSubmit={handleStartForging} error={error} />;
      case "clarification":
      case "suggestion":
      case "refining":
        return <ChatScreen 
                  chatHistory={chatHistory}
                  isLoading={isLoading}
                  onUserResponse={handleUserResponse}
                  projectSuggestion={projectSuggestion}
                  onApprove={handleApproveSuggestion}
                  onRefine={handleRefineSuggestion}
                  onStartOver={resetState}
                  step={step}
                />;
      case "final":
        return <FinalProposalScreen 
                  proposal={finalProposal}
                  projectName={formData.projectName}
                  isLoading={isLoading}
                  onStartOver={resetState}
                />;
      default:
        return null;
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-2rem)]">
        <header className="p-4 border-b border-zinc-800 flex items-center justify-center">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">
            Project Forge AI
            </h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4">
          {renderStep()}
        </main>
    </div>
  );
}

// --- SCREEN & UI COMPONENTS ---

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

const InitialScreen = ({ formData, setFormData, onSubmit, error }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64Data = await fileToBase64(file);
      setFormData(prev => ({ ...prev, referenceDoc: { name: file.name, mimeType: file.type, base64Data } }));
    } else {
        setFormData(prev => ({ ...prev, referenceDoc: null }));
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full max-w-lg p-8 space-y-6 bg-zinc-900 border border-zinc-800 rounded-xl">
        <h2 className="text-2xl font-semibold text-center text-white">Start a New Project</h2>
        {error && <div className="p-3 text-sm text-red-400 bg-red-900/50 border border-red-400/30 rounded-lg">{error}</div>}
        <div className="space-y-4">
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-zinc-400 mb-2">Project Name</label>
            <input type="text" name="projectName" id="projectName" value={formData.projectName} onChange={handleInputChange} className="form-input" placeholder="e.g., AI-powered Recipe App" />
          </div>
          <div>
            <label htmlFor="skills" className="block text-sm font-medium text-zinc-400 mb-2">Skills to Learn</label>
            <textarea name="skills" id="skills" value={formData.skills} onChange={handleInputChange} className="form-textarea" placeholder="e.g., React, TypeScript, Firebase"></textarea>
          </div>
          <div>
            <label htmlFor="experience" className="block text-sm font-medium text-zinc-400 mb-2">Experience Level</label>
            <select name="experience" id="experience" value={formData.experience} onChange={handleInputChange} className="form-select">
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
          <div>
            <label htmlFor="referenceUrl" className="block text-sm font-medium text-zinc-400 mb-2">Reference URL (Optional)</label>
            <input type="url" name="referenceUrl" id="referenceUrl" value={formData.referenceUrl} onChange={handleInputChange} className="form-input" placeholder="https://example.com/docs" />
          </div>
          <div>
            <label htmlFor="referenceDoc" className="block text-sm font-medium text-zinc-400 mb-2">Reference Document (Optional)</label>
            <input type="file" name="referenceDoc" id="referenceDoc" onChange={handleFileChange} className="form-input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-900/50 file:text-orange-300 hover:file:bg-orange-800" />
            {formData.referenceDoc && <p className="text-xs text-zinc-500 mt-2">Loaded: {formData.referenceDoc.name}</p>}
          </div>
        </div>
        <button onClick={onSubmit} className="btn btn-primary w-full">
          Start Forging
        </button>
      </div>
    </div>
  );
};

const ChatScreen = ({ chatHistory, isLoading, onUserResponse, projectSuggestion, onApprove, onRefine, onStartOver, step }) => {
    const [userInput, setUserInput] = useState("");
    const [refineInput, setRefineInput] = useState("");
    const [isRefining, setIsRefining] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [chatHistory, projectSuggestion, isLoading]);

    const handleSend = () => {
        if (userInput.trim()) {
            onUserResponse(userInput.trim());
            setUserInput("");
        }
    };
    
    const handleRefineSend = () => {
        if (refineInput.trim()) {
            onRefine(refineInput.trim());
            setRefineInput("");
            setIsRefining(false);
        }
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 space-y-6 overflow-y-auto pr-2">
                {chatHistory.map((msg, index) => (
                    msg.role === 'system' ? (
                        <div key={index} className="flex justify-center items-center gap-2 text-sm text-zinc-500">
                            <div className="spinner"></div>
                            {msg.content}
                        </div>
                    ) : (
                        <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'ai' && <div className="p-2 bg-zinc-800 rounded-full"><BotIcon/></div>}
                            <div className={`max-w-xl p-4 rounded-xl ${msg.role === 'user' ? 'bg-orange-600 text-white' : 'bg-zinc-800'}`}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                            {msg.role === 'user' && <div className="p-2 bg-zinc-800 rounded-full"><UserIcon/></div>}
                        </div>
                    )
                ))}
                
                {projectSuggestion && (
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-zinc-800 rounded-full"><BotIcon/></div>
                        <div className="w-full max-w-xl p-4 rounded-xl bg-zinc-800">
                            <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(projectSuggestion) }}></div>
                            {!isLoading && step === 'suggestion' && !isRefining && (
                                <div className="mt-4 pt-4 border-t border-zinc-700 flex flex-wrap gap-2">
                                    <button onClick={onApprove} className="btn btn-primary"><CheckIcon/>Looks Good!</button>
                                    <button onClick={() => setIsRefining(true)} className="btn btn-secondary"><EditIcon />Request Changes</button>
                                    <button onClick={onStartOver} className="btn btn-ghost"><RestartIcon/>Start Over</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {isLoading && !projectSuggestion && (
                    <div className="flex justify-center items-center gap-2 text-sm text-zinc-500">
                        <div className="spinner"></div>
                        Thinking...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800">
                {step === 'clarification' && !isLoading && (
                    <div className="relative">
                        <input 
                            type="text" 
                            value={userInput} 
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type your answer..."
                            className="form-input pr-12"
                        />
                        <button onClick={handleSend} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-orange-600 text-white hover:bg-orange-500">
                            <SendIcon />
                        </button>
                    </div>
                )}
                {isRefining && !isLoading && (
                     <div className="relative">
                        <input 
                            type="text" 
                            value={refineInput} 
                            onChange={(e) => setRefineInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleRefineSend()}
                            placeholder="What would you like to change?"
                            className="form-input pr-12"
                        />
                        <button onClick={handleRefineSend} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-orange-600 text-white hover:bg-orange-500">
                            <SendIcon />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const FinalProposalScreen = ({ proposal, projectName, isLoading, onStartOver }) => {
    
    const downloadFile = (content, fileName, contentType) => {
        const a = document.createElement("a");
        const file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
    }
    
    const handleDownload = (format: "txt" | "json" | "html") => {
        const sanitizedName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        
        switch(format) {
            case "txt":
                downloadFile(proposal, `${sanitizedName}_proposal.txt`, "text/plain");
                break;
            case "json":
                const jsonContent = {
                    projectName: projectName,
                    proposalMarkdown: proposal,
                };
                downloadFile(JSON.stringify(jsonContent, null, 2), `${sanitizedName}_proposal.json`, "application/json");
                break;
            case "html":
                const htmlContent = `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>${projectName} - Project Proposal</title>
                        <style>
                            body { font-family: sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
                            h1, h2, h3 { color: #000; }
                            pre { background-color: #f4f4f4; padding: 1rem; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; }
                            code { font-family: monospace; }
                            blockquote { border-left: 4px solid #ddd; padding-left: 1rem; color: #666; }
                            table { border-collapse: collapse; width: 100%; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background-color: #f2f2f2; }
                        </style>
                    </head>
                    <body>
                        ${marked.parse(proposal)}
                    </body>
                    </html>
                `;
                downloadFile(htmlContent, `${sanitizedName}_proposal.html`, "text/html");
                break;
        }
    }
    
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                <div className="spinner"></div>
                <p className="mt-4">Generating your final proposal...</p>
            </div>
        );
    }

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2 sm:p-6 h-full flex flex-col">
            <div className="flex-shrink-0 mb-4 pb-4 border-b border-zinc-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-semibold text-white">Final Project Proposal</h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => handleDownload('txt')} className="btn btn-secondary"><DownloadIcon/>TXT</button>
                    <button onClick={() => handleDownload('json')} className="btn btn-secondary"><DownloadIcon/>JSON</button>
                    <button onClick={() => handleDownload('html')} className="btn btn-secondary"><DownloadIcon/>HTML</button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto pr-2">
                <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(proposal) }}></div>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-700 text-center">
                 <button onClick={onStartOver} className="btn btn-primary">
                    <RestartIcon/>Forge a New Project
                </button>
            </div>
        </div>
    );
};

// --- Render App ---
const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);