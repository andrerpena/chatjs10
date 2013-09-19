using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ChatJs.Net;
using ChatJsMvcSample.Models.Database;
using Microsoft.AspNet.SignalR;

namespace ChatJsMvcSample.Code
{
    public class ChatHub : Hub, IChatHub
    {
        /// <summary>
        /// This STUB. In a normal situation, there would be multiple rooms and the user room would have to be 
        /// determined by the user profile
        /// </summary>
        public const string ROOM_ID_STUB = "chatjs-room";

        /// <summary>
        /// Current connections
        /// 1 room has many users that have many connections (2 open browsers from the same user represents 2 connections)
        /// </summary>
        private static readonly Dictionary<string, Dictionary<int, List<string>>> connections = new Dictionary<string, Dictionary<int, List<string>>>();

        /// <summary>
        /// This is STUB. This will SIMULATE a database of chat messages
        /// </summary>
        private static readonly List<DbChatMessageStub> dbChatMessagesStub = new List<DbChatMessageStub>();

        /// <summary>
        /// This method is STUB. This will SIMULATE a database of users
        /// </summary>
        private static readonly List<DbUserStub> dbUsersStub = new List<DbUserStub>();

        /// <summary>
        /// This method is STUB. In a normal situation, the user info would come from the database so this method wouldn't be necessary.
        /// It's only necessary because this class is simulating the database
        /// </summary>
        /// <param name="newUser"></param>
        public static void RegisterNewUser(DbUserStub newUser)
        {
            if (newUser == null) throw new ArgumentNullException("newUser");
            dbUsersStub.Add(newUser);
        }

        /// <summary>
        /// This method is STUB. Returns if a user is registered in the FAKE DB.
        /// Normally this wouldn't be necessary.
        /// </summary>
        /// <param name="user"></param>
        /// <returns></returns>
        public static bool IsUserRegisteredInDbUsersStub(DbUserStub user)
        {
            return dbUsersStub.Any(u => u.Id == user.Id);
        }

        /// <summary>
        /// Tries to find a user with the provided e-mail
        /// </summary>
        /// <param name="email"></param>
        /// <returns></returns>
        public static DbUserStub FindUserByEmail(string email)
        {
            if (email == null) return null;
            return dbUsersStub.FirstOrDefault(u => u.Email == email);
        }

        /// <summary>
        /// If the specified user is connected, return information about the user
        /// </summary>
        public ChatUser GetUserInfo(int userId)
        {
            var user = dbUsersStub.FirstOrDefault(u => u.Id == userId);
            return user == null ? null : GetChatUserFromDbUserId(userId);
        }

        private ChatUser GetChatUserFromDbUserId(int dbUserId)
        {
            var myRoomId = this.GetMyRoomId();

            // this is STUB. Normally you would go to the database get the real user
            var dbUser = dbUsersStub.First(u => u.Id == dbUserId);

            ChatUser.StatusType userStatus;
            lock (connections)
            {
                userStatus = connections.ContainsKey(myRoomId)
                                 ? (connections[myRoomId].ContainsKey(dbUser.Id)
                                        ? ChatUser.StatusType.Online
                                        : ChatUser.StatusType.Offline)
                                 : ChatUser.StatusType.Offline;
            }
            return new ChatUser()
            {
                Id = dbUser.Id,
                Name = dbUser.FullName,
                Status = userStatus,
                ProfilePictureUrl = GravatarHelper.GetGravatarUrl(GravatarHelper.GetGravatarHash(dbUser.Email), GravatarHelper.Size.s32)
            };
        }

        private ChatMessage GetChatMessage(DbChatMessageStub chatMessage, string clientGuid)
        {
            return new ChatMessage()
            {
                Message = chatMessage.Message,
                UserFrom = this.GetChatUserFromDbUserId(chatMessage.UserFromId),
                UserTo = this.GetChatUserFromDbUserId(chatMessage.UserToId),
                ClientGuid = clientGuid
            };
        }

        /// <summary>
        /// Returns my user id
        /// </summary>
        /// <returns></returns>
        private int GetMyUserId()
        {
            // This would normally be done like this:
            //var userPrincipal = this.Context.User as AuthenticatedPrincipal;
            //if (userPrincipal == null)
            //    throw new NotAuthorizedException();

            //var userData = userPrincipal.Profile;
            //return userData.Id;

            // But for this example, it will get my user from the cookie
            return ChatCookieHelperStub.GetDbUserFromCookie(this.Context.Request).Id;
        }

        private string GetMyRoomId()
        {
            // This would normally be done like this:
            //var userPrincipal = this.Context.User as AuthenticatedPrincipal;
            //if (userPrincipal == null)
            //    throw new NotAuthorizedException();

            //var userData = userPrincipal.Profile;
            //return userData.MyTenancyIdentifier;

            // But for this example, it will always return "chatjs-room", because we have only one room.
            return ROOM_ID_STUB;
        }

        /// <summary>
        /// Broadcasts to all users in the same room the new users list
        /// </summary>
        private void BroadcastUsersList()
        {
            var myRoomId = this.GetMyRoomId();
            var connectionIds = new List<string>();
            lock (connections)
            {
                if (connections.ContainsKey(myRoomId))
                    connectionIds = connections[myRoomId].Keys.SelectMany(userId => connections[myRoomId][userId]).ToList();
            }

            // gets the current room user's list

            // this is STUB. You would normally go to the database to get the real room users
            var dbRoomUsers = dbUsersStub.Where(u => u.TenancyId == myRoomId).OrderBy(u => u.FullName).ToList();
            var usersList = dbRoomUsers.Select(u => this.GetChatUserFromDbUserId(u.Id)).ToList();

            foreach (var connectionId in connectionIds)
                this.Clients.Client(connectionId).usersListChanged(usersList);
        }

        private DbChatMessageStub PersistMessage(int otherUserId, string message)
        {
            var myUserId = this.GetMyUserId();

            // this is STUB. Normally you would go to the real database to get the my user and the other user
            var myUser = dbUsersStub.FirstOrDefault(u => u.Id == myUserId);
            var otherUser = dbUsersStub.FirstOrDefault(u => u.Id == otherUserId);

            if (myUser == null || otherUser == null)
                return null;

            var dbChatMessage = new DbChatMessageStub()
            {
                Date = DateTime.UtcNow,
                Message = message,
                UserFromId = myUserId,
                UserToId = otherUserId,
                TenancyId = myUser.TenancyId
            };

            // this is STUB. Normally you would add the dbMessage to the real database
            dbChatMessagesStub.Add(dbChatMessage);

            // normally you would save the database changes
            //this.db.SaveChanges();

            return dbChatMessage;
        }

        /// <summary>
        /// Returns the message history
        /// </summary>
        public List<ChatMessage> GetMessageHistory(int otherUserId)
        {
            var myUserId = this.GetMyUserId();
            // this is STUB. Normally you would go to the real database to get the messages
            var dbMessages = dbChatMessagesStub
                               .Where(
                                   m =>
                                   (m.UserToId == myUserId && m.UserFromId == otherUserId) ||
                                   (m.UserToId == otherUserId && m.UserFromId == myUserId))
                               .OrderByDescending(m => m.Date).Take(30).ToList();

            dbMessages.Reverse();
            return dbMessages.Select(m => this.GetChatMessage(m, null)).ToList();
        }

        /// <summary>
        /// Sends a message to a particular user
        /// </summary>
        public void SendMessage(int otherUserId, string message, string clientGuid)
        {
            var myUserId = this.GetMyUserId();
            var myRoomId = this.GetMyRoomId();


            var dbChatMessage = PersistMessage(otherUserId, message);
            var connectionIds = new List<string>();
            lock (connections)
            {
                if (connections[myRoomId].ContainsKey(otherUserId))
                    connectionIds.AddRange(connections[myRoomId][otherUserId]);
                if (connections[myRoomId].ContainsKey(myUserId))
                    connectionIds.AddRange(connections[myRoomId][myUserId]);
            }
            foreach (var connectionId in connectionIds)
                this.Clients.Client(connectionId).sendMessage(this.GetChatMessage(dbChatMessage, clientGuid));
        }

        /// <summary>
        /// Sends a typing signal to a particular user
        /// </summary>
        public void SendTypingSignal(int otherUserId)
        {
            var myUserId = this.GetMyUserId();
            var myRoomId = this.GetMyRoomId();

            var connectionIds = new List<string>();
            lock (connections)
            {
                if (connections[myRoomId].ContainsKey(otherUserId))
                    connectionIds.AddRange(connections[myRoomId][otherUserId]);
            }
            foreach (var connectionId in connectionIds)
                this.Clients.Client(connectionId).sendTypingSignal(this.GetUserInfo(myUserId));
        }

        public override Task OnConnected()
        {
            var myRoomId = this.GetMyRoomId();
            var myUserId = this.GetMyUserId();

            lock (connections)
            {
                if (!connections.ContainsKey(myRoomId))
                    connections[myRoomId] = new Dictionary<int, List<string>>();

                if (!connections[myRoomId].ContainsKey(myUserId))
                    connections[myRoomId][myUserId] = new List<string>();

                connections[myRoomId][myUserId].Add(this.Context.ConnectionId);
            }

            this.BroadcastUsersList();

            return base.OnConnected();
        }

        public override Task OnDisconnected()
        {
            var myRoomId = this.GetMyRoomId();
            var myUserId = this.GetMyUserId();

            lock (connections)
            {
                if (connections.ContainsKey(myRoomId))
                    if (connections[myRoomId].ContainsKey(myUserId))
                        if (connections[myRoomId][myUserId].Contains(this.Context.ConnectionId))
                        {
                            connections[myRoomId][myUserId].Remove(this.Context.ConnectionId);
                            if (!connections[myRoomId][myUserId].Any())
                            {
                                connections[myRoomId].Remove(myUserId);
                                Task.Run(() =>
                                    {
                                        // this will run in separate thread.
                                        // If the user is away for more than 10 seconds it will be removed from 
                                        // the room.
                                        // In a normal situation this wouldn't be done because normally the users in a
                                        // chat room are fixed, like when you have 1 chat room for each tenancy
                                        Thread.Sleep(10000);
                                        if (!connections[myRoomId].ContainsKey(myUserId))
                                        {
                                            var myDbUser = dbUsersStub.FirstOrDefault(u => u.Id == myUserId);
                                            if (myDbUser != null)
                                            {
                                                dbUsersStub.Remove(myDbUser);
                                                this.BroadcastUsersList();
                                            }
                                        }
                                    });
                            }
                        }
            }

            return base.OnDisconnected();
        }
    }
}