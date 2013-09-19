using System.Collections.Generic;

namespace ChatJs.Net
{
    public interface IChatHub
    {
        /// <summary>
        /// Returns the message history between the current user and another user
        /// </summary>
        List<ChatMessage> GetMessageHistory(int otherUserId);

        /// <summary>
        /// Sends a message to a another user
        /// </summary>
        void SendMessage(int otherUserId, string message, string clientGuid);

        /// <summary>
        /// Sends a typing signal to a another user
        /// </summary>
        void SendTypingSignal(int otherUserId);

        /// <summary>
        /// When a new client connects
        /// </summary>
        System.Threading.Tasks.Task OnConnected();

        /// <summary>
        /// When a client disconnects
        /// </summary>
        System.Threading.Tasks.Task OnDisconnected();
    }
}