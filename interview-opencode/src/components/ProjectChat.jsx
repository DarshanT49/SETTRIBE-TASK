import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Send, Paperclip, Video, MessageSquare, MoreVertical, Search, Pin, X } from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import { Avatar, Button, Input } from './ui';
import api from '../services/api';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { createNotification } from '../services/notifications';

export default function ProjectChat({ project, users }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [stompClient, setStompClient] = useState(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [mentionIndex, setMentionIndex] = useState(-1);
  const [selectedMentionIdx, setSelectedMentionIdx] = useState(0);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Establish WebSockets
  useEffect(() => {
    if (!project || !project.id) return;

    // Fetch initial chat history via REST
    api.get(`/projects/${project.id}/chat`)
      .then(res => {
        if (Array.isArray(res.data)) {
          setMessages(res.data);
          scrollToBottom();
        }
      })
      .catch(err => console.error("Error fetching chat history", err));

    const wsUrl = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '/ws-chat') : 'http://localhost:8080/ws-chat';
    
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      debug: (str) => { /* console.log(str) */ },
      onConnect: () => {
        client.subscribe(`/topic/project/${project.id}`, (message) => {
          const newMsg = JSON.parse(message.body);
          
          // Show a toast if I was mentioned in this incoming message
          if (newMsg.senderId !== currentUser.id && newMsg.content) {
            const mentionName = currentUser.name.replace(/\s+/g, '');
            // Case-insensitive check
            if (newMsg.content.toLowerCase().includes(`@${mentionName.toLowerCase()}`)) {
              toast(`You were mentioned in ${project.title} chat!`, { icon: '🔔', duration: 4000 });
            }
          }

          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, [project?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);

    // Detect @mention typing
    const lastWord = val.split(' ').pop();
    if (lastWord.startsWith('@')) {
      setShowMentions(true);
      setMentionFilter(lastWord.substring(1).toLowerCase());
      setMentionIndex(val.lastIndexOf('@'));
      setSelectedMentionIdx(0); // Reset selection
    } else {
      setShowMentions(false);
    }
  };

  const handleKeyDown = (e) => {
    if (showMentions && mentionSuggestions.length > 0) {
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(mentionSuggestions[selectedMentionIdx] || mentionSuggestions[0]);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIdx(prev => Math.min(prev + 1, mentionSuggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIdx(prev => Math.max(prev - 1, 0));
      }
    }
  };

  const insertMention = (user) => {
    const before = input.substring(0, mentionIndex);
    const mentionName = user.name.replace(/\s+/g, '');
    // Replace the incomplete @mention with the full username (without spaces)
    setInput(`${before}@${mentionName} `);
    setShowMentions(false);
    // Small timeout ensures the focus happens after the state update cycle
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleFileAttach = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        toast.error("File size must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedFile({
          name: file.name,
          type: file.type,
          data: reader.result // Base64 for simplicity in this mock
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = (e) => {
    e?.preventDefault();
    if (!input.trim() && !attachedFile) return;

    let messageType = 'TEXT';
    let metadataObj = {};

    if (attachedFile) {
      messageType = attachedFile.type.startsWith('image/') ? 'IMAGE' : 'FILE';
      metadataObj = {
        fileName: attachedFile.name,
        fileData: attachedFile.data
      };
    }

    const payload = {
      id: uuidv4(),
      projectId: project.id,
      senderId: currentUser.id,
      content: input,
      messageType: messageType,
      metadata: JSON.stringify(metadataObj),
      readBy: JSON.stringify([currentUser.id]),
      createdAt: new Date().toISOString()
    };

    // Detect mentions
    const mentionRegex = /@(\w+)/g;
    const mentions = input.match(mentionRegex) || [];
    const mentionedUsers = [];
    
    mentions.forEach(mention => {
      const name = mention.substring(1).toLowerCase();
      const user = users.find(u => u.name.replace(/\s+/g, '').toLowerCase() === name);
      if (user && project.teamIds?.includes(user.id) && !mentionedUsers.includes(user.id)) {
        mentionedUsers.push(user.id);
      }
    });

    // Create persistent notifications for mentioned users
    mentionedUsers.forEach(userId => {
      createNotification({
        userId,
        type: 'mention',
        title: 'New Mention',
        message: `${currentUser.name} mentioned you in the ${project.title} project chat`,
        relatedId: project.id,
        relatedType: 'project'
      });
    });

    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(payload)
      });
      setInput('');
      setAttachedFile(null);
      setShowMentions(false);
    } else {
      toast.error("Chat disconnected. Reconnecting...");
    }
  };

  const launchQuickMeeting = async () => {
    const meetingTitle = `Quick Sync: ${project.title}`;
    const newMeeting = {
      title: meetingTitle,
      type: 'project',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      hostId: currentUser.id,
      participantIds: project.teamIds || [],
      projectId: project.id,
      status: 'active',
      duration: 30,
      description: 'Quick project team sync launched from chat.',
      allowGuest: false
    };

    try {
      const res = await api.post('/meetings', newMeeting);
      const createdId = res.data?.id || res.data;
      
      // Send a system message to chat
      if (stompClient && stompClient.connected) {
        stompClient.publish({
          destination: '/app/chat.send',
          body: JSON.stringify({
            id: uuidv4(),
            projectId: project.id,
            senderId: 'SYSTEM',
            content: `Project Meeting Started by ${currentUser.name}. Click 'Join Meeting' to participate.`,
            messageType: 'SYSTEM',
            metadata: JSON.stringify({ meetingId: createdId }),
            readBy: '[]',
            createdAt: new Date().toISOString()
          })
        });
      }
      
      toast.success("Quick Meeting Started!");
      navigate(`/meetings/${createdId}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to start meeting");
    }
  };

  const getUser = (uid) => users.find(u => u.id === uid) || { name: 'Unknown User' };

  // Mention autocomplete suggestions
  const mentionSuggestions = users.filter(u => 
    project.teamIds?.includes(u.id) && 
    u.name.toLowerCase().includes(mentionFilter)
  ).slice(0, 5);

  return (
    <div className="flex flex-col h-[600px] border border-gray-800 rounded-xl overflow-hidden bg-gray-900/50">
      {/* Header */}
      <div className="p-3 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <MessageSquare className="text-primary-400" size={18} />
          <h3 className="font-semibold text-gray-100">Project Team Chat</h3>
          <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">{project.teamIds?.length} members</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={launchQuickMeeting} className="bg-emerald-600 hover:bg-emerald-500">
            <Video size={14} /> Quick Meeting
          </Button>
          <button className="text-gray-400 hover:text-gray-200 p-1">
            <Search size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm mt-20">
            Start the conversation for {project.title}!
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.senderId === currentUser.id;
          const sender = getUser(msg.senderId);
          const meta = msg.metadata ? JSON.parse(msg.metadata) : {};

          if (msg.messageType === 'SYSTEM') {
            return (
              <div key={msg.id} className="flex justify-center my-4">
                <div className="bg-gray-800/80 rounded-full px-4 py-1.5 text-xs text-gray-300 flex items-center gap-2">
                  <Video size={12} className="text-blue-400" />
                  {msg.content}
                  {meta.meetingId && (
                    <Button size="xs" onClick={() => navigate(`/meetings/${meta.meetingId}`)} className="ml-2 h-6 px-2 text-[10px]">
                      Join
                    </Button>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
              {!isMe && <Avatar name={sender.name} size="sm" />}
              <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                {!isMe && <span className="text-xs text-gray-500 ml-1 mb-1">{sender.name}</span>}
                <div className={`p-3 rounded-2xl ${isMe ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-200 rounded-tl-none'}`}>
                  {msg.content && (
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.content.split(/(@\w+)/g).map((part, index) => {
                        if (part.startsWith('@')) {
                          return <span key={index} className="font-semibold text-amber-300 bg-amber-900/30 px-1 rounded">{part}</span>;
                        }
                        return part;
                      })}
                    </p>
                  )}
                  {msg.messageType === 'IMAGE' && meta.fileData && (
                    <img src={meta.fileData} alt="attachment" className="mt-2 max-w-full rounded-lg max-h-48 object-cover border border-gray-700/50" />
                  )}
                  {msg.messageType === 'FILE' && meta.fileName && (
                    <div className="flex items-center gap-2 mt-2 bg-gray-900/40 p-2 rounded border border-gray-700/30">
                      <Paperclip size={14} />
                      <span className="text-xs truncate">{meta.fileName}</span>
                      <a href={meta.fileData} download={meta.fileName} className="text-xs text-blue-300 hover:underline ml-2">Download</a>
                    </div>
                  )}
                </div>
                <div className={`text-[10px] text-gray-500 mt-1 flex items-center gap-1 ${isMe ? 'justify-end pr-1' : 'pl-1'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-gray-800 border-t border-gray-700 relative">
        {/* Mentions Popover */}
        {showMentions && mentionSuggestions.length > 0 && (
          <div className="absolute bottom-full left-4 mb-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-20">
            {mentionSuggestions.map((u, idx) => (
              <button 
                key={u.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertMention(u)}
                onMouseEnter={() => setSelectedMentionIdx(idx)}
                className={`w-full flex items-center gap-2 p-2 text-left transition-colors ${selectedMentionIdx === idx ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
              >
                <Avatar name={u.name} size="xs" />
                <span className="text-sm text-gray-200">{u.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Attached file preview */}
        {attachedFile && (
          <div className="flex items-center gap-2 mb-2 bg-gray-900 p-2 rounded-lg w-max border border-gray-700">
            <Paperclip size={14} className="text-primary-400" />
            <span className="text-xs text-gray-300 truncate max-w-[200px]">{attachedFile.name}</span>
            <button onClick={() => setAttachedFile(null)} className="text-gray-500 hover:text-red-400 ml-1">
              <X size={14} />
            </button>
          </div>
        )}

        <form onSubmit={sendMessage} className="flex gap-2 items-end">
          <label className="p-2.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors flex-shrink-0">
            <Paperclip size={18} />
            <input type="file" className="hidden" onChange={handleFileAttach} />
          </label>
          <div className="flex-1 bg-gray-900 rounded-xl border border-gray-700 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Use @ to mention)"
              className="w-full bg-transparent border-none focus:ring-0 text-sm text-gray-100 p-3 h-11"
              autoComplete="off"
            />
          </div>
          <button 
            type="submit" 
            disabled={!input.trim() && !attachedFile}
            className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
