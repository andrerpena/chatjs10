using System;
using System.Web.Mvc;
using ChatJs.Net;
using ChatJsMvcSample.Code;
using ChatJsMvcSample.Models.Database;
using ChatJsMvcSample.Models.ViewModels;

namespace ChatJsMvcSample.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            var existingUser = ChatCookieHelperStub.GetDbUserFromCookie(this.Request);
            ChatViewModel chatViewModel = null;
            if (existingUser != null)
            {
                if (!ChatHub.IsUserRegisteredInDbUsersStub(existingUser))
                {
                    // cookie is invalid
                    ChatCookieHelperStub.RemoveCookie(this.Response);
                    return this.RedirectToAction("Index");
                }

                // in this case the authentication cookie is valid and we must render the chat
                chatViewModel = new ChatViewModel()
                    {
                        IsUserAuthenticated = true,
                        UserId = existingUser.Id,
                        UserName = existingUser.FullName,
                        UserProfilePictureUrl =
                            GravatarHelper.GetGravatarUrl(GravatarHelper.GetGravatarHash(existingUser.Email), GravatarHelper.Size.s32)
                    };
            }

            return this.View(chatViewModel);
        }

        /// <summary>
        /// Joins the chat
        /// </summary>
        public ActionResult JoinChat(string userName, string email)
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
            ChatCookieHelperStub.CreateNewUserCookie(this.Response, dbUSer);
            return this.RedirectToAction("Index");
        }

        /// <summary>
        /// Leaves the chat
        /// </summary>
        public ActionResult LeaveChat(string userName, string email)
        {
            ChatCookieHelperStub.RemoveCookie(this.Response);
            return this.RedirectToAction("Index");
        }
    }
}