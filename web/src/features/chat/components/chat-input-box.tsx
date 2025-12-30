import React, {ChangeEvent, EventHandler, KeyboardEventHandler, useRef, useState} from "react";
import {Button} from "../../../components/ui/button";
import {SendIcon} from "lucide-react";
import {Textarea} from "../../../components/ui/textarea";

interface ChatInputBoxProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInputBox({ onSend, disabled }: ChatInputBoxProps) {
  const [input, setInput] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (disabled || !input.trim()) return;
    onSend(input);
    setInput('');
  };

  function resizeTextArea(e: HTMLTextAreaElement) {
    e.style.height = "1px";
    e.style.height = e.scrollHeight + "px";
  }

  const onTextChange: EventHandler<ChangeEvent<HTMLTextAreaElement>> = (e) => {
    resizeTextArea(e.target);
    setInput(e.target.value);
  };

  const onKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter") {
      const modKey = e.shiftKey || e.ctrlKey || e.metaKey || e.altKey;
      if (!modKey) {
        e.preventDefault();
        handleSend();
      }
    }
  };

  return (
      <div className={"flex flex-col gap-2"}>
        <div className="flex items-end gap-2">
          <Textarea
              ref={textAreaRef}
              className={"h-10 max-h-36 min-h-10 resize-none pr-10"}
              value={input}
              onChange={onTextChange}
              onKeyDown={onKeyDown}
              placeholder="Type your message..."
              disabled={disabled}
          />
          <Button onClick={handleSend} disabled={disabled || !input.trim()}>
            <SendIcon className={"me-2 h-5 w-5"}/>
            {disabled ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
  );
}