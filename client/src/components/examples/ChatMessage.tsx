import ChatMessage from "../ChatMessage";

export default function ChatMessageExample() {
  return (
    <div className="flex flex-col gap-4 p-6 max-w-3xl mx-auto">
      <ChatMessage role="user" content="What is the meaning of life?" />
      <ChatMessage
        role="assistant"
        content="The meaning of life is a profound philosophical question that has been pondered throughout human history. While there's no single definitive answer, many perspectives suggest it involves finding purpose, creating meaningful connections, pursuing growth, and contributing positively to the world around us."
      />
    </div>
  );
}
