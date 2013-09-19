using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Script.Serialization;
using ChatJsWebFormsSample.Models.Database;

namespace ChatJsWebFormsSample.Home
{
    /// <summary>
    /// Summary description for ChatService
    /// </summary>
    public class ChatService : IHttpHandler
    {
        public void ProcessRequest(HttpContext context)
        {
            try
            {
                var action = context.Request["action"];
                var userName = context.Request["userName"];
                var userEmail = context.Request["email"];

                switch (action)
                {
                    case "joinChat":
                        this.JoinChat(userName, userEmail, new HttpResponseWrapper(context.Response));
                        break;
                    case "leaveChat":
                        this.LeaveChat(userName, userEmail, new HttpResponseWrapper(context.Response));
                        break;
                }
                context.Response.ContentType = "application/json";
                context.Response.Write(new JavaScriptSerializer().Serialize(new { Success = true }));
            }
            catch (Exception ex)
            {
                context.Response.ContentType = "application/json";
                context.Response.Write(new JavaScriptSerializer().Serialize(new { Success = false, Message = ex.Message }));
            }
        }

        /// <summary>
        /// Joins the chat
        /// </summary>
        private void JoinChat(string userName, string email, HttpResponseBase response)
        {
            // try to find an existing user with the same e-mail
            var dbUSer = ChatHub.FindUserByEmail(email);
            if (dbUSer == null)
            {
                // This is all STUB. In a normal situation, 
                dbUSer = new DbUserStub()
                {
                    FullName = userName,
                    Email = email,
                    Id = new Random().Next(100000),
                    TenancyId = ChatHub.ROOM_ID_STUB
                };
                // Normally it wouldn't be necessary to add the user to the ChatHub, because ChatHub
                // would get users from the database, but there's no database here
                ChatHub.RegisterNewUser(dbUSer);
            }

            // Normally it wouldn't be necessary to create this cookie because the
            // FormsAuthentication cookie does this
            ChatCookieHelperStub.CreateNewUserCookie(response, dbUSer);
        }

        /// <summary>
        /// Leaves the chat
        /// </summary>
        private void LeaveChat(string userName, string email, HttpResponseBase response)
        {
            ChatCookieHelperStub.RemoveCookie(response);
        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}