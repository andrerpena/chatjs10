namespace ChatJs.Net
{
    public class ChatMessage
    {
        /// <summary>
        /// The user that sent the message
        /// </summary>
        public ChatUser UserFrom { get; set; }

        /// <summary>
        /// The user to whom the message is to
        /// </summary>
        public ChatUser UserTo { get; set; }

        /// <summary>
        /// Message timestamp
        /// </summary>
        public long Timestamp { get; set; }

        /// <summary>
        /// Message text
        /// </summary>
        public string Message { get; set; }

        /// <summary>
        /// Client GUID
        /// </summary>
        /// <remarks>
        /// Every time a message is sent from the client, the client must specify an unique message client GUID. This is
        /// because when you send a message to the server, the message comes back to the client. This is useful for 2 reasons:
        /// 1) It allows the client to know that probably the other user received the message
        /// 2) It allows for different browser windows to be synchronized
        /// </remarks>
        public string ClientGuid { get; set; }
    }
}