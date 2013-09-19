using System;
using ChatJs.Net;

namespace ChatJsMvcSample.Models.Database
{
    public class DbChatMessageStub : ChatMessage
    {
        public DateTime Date { get; set; }

        public int UserFromId { get; set; }

        public int UserToId { get; set; }

        public string TenancyId { get; set; }
    }
}