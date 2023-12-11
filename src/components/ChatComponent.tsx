"use client";
import React, { useEffect } from "react";
import { Input } from "./ui/input";
import { useChat, useCompletion } from "ai/react";
import { Send } from "lucide-react";
import { Button } from "./ui/button";
import MessagesList from "./MessagesList";

type Props = {
  chatId: number;
};

const ChatComponent = ({ chatId }: Props) => {
  const { input, handleInputChange, handleSubmit, messages } = useChat({
    api: "/api/chat",
    body: {
      chatId,
    },
  });

  useEffect(() => {
    const messageConatiner = document.getElementById("message-container");
    if (messageConatiner) {
      messageConatiner.scrollTo({
        top: messageConatiner.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div className="relative max-h-screen" id="message-container">
      {/* Header */}
      <div className="sticky top-0 inset-x-0 p-2 bg-white h-fit">
        <h3 className="text-xl font-bold">Chat</h3>
      </div>
      {/* Messages List */}
      <MessagesList messages={messages} />

      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 inset-x-0 px-2 py-4 bg-white"
      >
        <div className="flex">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask any question..."
            className="w-full"
          />
          <Button className="bg-blue-600 ml-2">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatComponent;
