import {ChatSidebar} from "../components/chat-sidebar";
import {ChatInputBox} from "../components/chat-input-box";
import {ChatMessageList} from "../components/chat-message-list";
import {ModelSelector} from "../components/model-selector";
import {useChat} from "../hooks/useChat";
import {useModelsQuery} from "../data/queries/models";
import Spinner from "../components/ui/spinner";

export function HomePage() {
    const {
        selectedChatId,
        chats,
        messages,
        isLoadingChats,
        isLoadingChat,
        selectChat,
        createChat,
        sendMessage,
        streamingContent,
        isStreaming,
        selectedModel,
        setSelectedModel,
    } = useChat();

    const modelsQuery = useModelsQuery();
    const defaultModelId = modelsQuery.data?.defaultModelId;

    const handleCreateChat = async () => {
        try {
            await createChat(selectedModel || defaultModelId);
        } catch (error) {
            console.error('Failed to create chat:', error);
        }
    };

    const handleSendMessage = async (content: string) => {
        if (!selectedChatId) {
            await handleCreateChat();
            return;
        }
        await sendMessage(content);
    };

    return (
        <div className="flex flex-col items-center">
            <ChatSidebar 
                chats={chats} 
                selectedChatId={selectedChatId} 
                onSelectChat={selectChat}
                onCreateChat={handleCreateChat}
                isLoading={isLoadingChats}
            />
            <div className="flex flex-col pt-8 max-w-4xl ms-64 w-full px-4">
                {selectedChatId ? (
                    <>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-2xl font-semibold text-foreground">
                                {chats.find(c => c.id === selectedChatId)?.title || 'Chat'}
                            </h2>
                            <ModelSelector 
                                selectedModelId={selectedModel || defaultModelId}
                                onModelChange={setSelectedModel}
                            />
                        </div>
                        {isLoadingChat ? (
                            <div className="flex items-center justify-center p-8">
                                <Spinner />
                            </div>
                        ) : (
                            <ChatMessageList 
                                messages={messages}
                                streamingContent={streamingContent}
                                isStreaming={isStreaming}
                            />
                        )}
                        <div className="mt-4">
                            <ChatInputBox 
                                onSend={handleSendMessage}
                                disabled={isLoadingChat}
                                isStreaming={isStreaming}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8">
                        <h2 className="text-xl font-semibold text-foreground mb-4">
                            Select a chat or create a new one
                        </h2>
                        <p className="text-muted-foreground">
                            Start a conversation by creating a new chat
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
