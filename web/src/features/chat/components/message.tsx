import React from "react";
import {cn} from "../../../lib/utils";
import Spinner from "../../../components/ui/spinner";
import {BotIcon, UserIcon} from "lucide-react";
import { MessageContent } from "./message-content";
import type { Message as MessageType } from "../types";

export function MessageContainer({ role, children }: React.PropsWithChildren<{ role: MessageType["role"] }>) {
    return (
        <div className={cn("flex flex-col gap-2", role === "user" ? "items-end" : "items-start")}>
            <div
                className={
                    "flex flex-row items-center gap-1 rounded-full bg-accent py-1.5 pe-3 ps-1.5 text-xs font-semibold"
                }
            >
                {role === "assistant" && <BotIcon className={"me-1 inline-block h-4 w-4"} />}
                {role === "user" && <UserIcon className={"me-1 inline-block h-4 w-4"} />}
                {role === "user" ? "You" : "Assistant"}
            </div>
            <div className={cn(role === "user" ? "pe-2 ps-16" : "flex w-full flex-col items-start pe-16 ps-2")}>
                {children}
            </div>
        </div>
    );
}

interface MessageProps {
  message: MessageType;
  isStreaming?: boolean;
}

export function Message({ message, isStreaming }: MessageProps) {
  return (
    <MessageContainer role={message.role}>
      {message.role === 'user' ? (
        <div className="text-sm">{message.content}</div>
      ) : (
        <MessageContent content={message.content} isStreaming={isStreaming} />
      )}
    </MessageContainer>
  );
}

export function AssistantLoadingIndicator() {
    return (
        <MessageContainer role={"assistant"}>
            <div
                className={
                    "flex flex-row items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-muted-foreground"
                }
            >
                <Spinner />
                Working on it...
            </div>
        </MessageContainer>
    );
}
