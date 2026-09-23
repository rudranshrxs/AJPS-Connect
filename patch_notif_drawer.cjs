const fs = require('fs');
let code = fs.readFileSync('src/components/notifications/NotificationDrawer.tsx', 'utf8');

const importReplacement = `
import React, { useEffect, useState } from 'react';
import { Bell, X, CheckCircle, Info, AlertTriangle, MessageSquare, Briefcase, CreditCard, XCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
`;
code = code.replace(/import React, \{ useEffect, useState \} from 'react';\nimport \{ Bell, X, CheckCircle, Info, AlertTriangle, MessageSquare, Briefcase, CreditCard, XCircle \} from 'lucide-react';\nimport \{ useAuth \} from '\.\.\/\.\.\/context\/AuthContext';/, importReplacement.trim());


const navigateReplacement = `
export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
`;
code = code.replace(/export function NotificationDrawer\(\{ isOpen, onClose \}: NotificationDrawerProps\) \{\n  const \{ currentUser \} = useAuth\(\);/, navigateReplacement.trim());


const handleActionReplacement = `
                    <span className="text-[10px] font-bold text-gray-400 mt-2 block uppercase tracking-wider">
                      {formatTime(notification.createdAt)}
                    </span>

                    {/* Smart Action Path */}
                    {notification.actionPath && notification.actionLabel && !notification.isRead && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                          onClose();
                          navigate(notification.actionPath!);
                        }}
                        className="mt-3 w-full flex items-center justify-center gap-2 bg-[#A05C2B]/10 text-[#A05C2B] border border-[#A05C2B]/20 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-[#A05C2B]/20 transition-colors shadow-sm"
                      >
                        {notification.actionLabel} <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Actionable UI for LEAVE_REQUEST */}
`;
code = code.replace(/<span className="text-\[10px\] font-bold text-gray-400 mt-2 block uppercase tracking-wider">\s*\{formatTime\(notification\.createdAt\)\}\s*<\/span>\s*\{\/\* Actionable UI for LEAVE_REQUEST \*\/\}/, handleActionReplacement.trim());


fs.writeFileSync('src/components/notifications/NotificationDrawer.tsx', code);
