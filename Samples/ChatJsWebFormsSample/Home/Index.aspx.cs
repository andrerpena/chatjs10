using System;
using System.Web;
using ChatJs.Net;

namespace ChatJsWebFormsSample.Home
{
    public partial class Index : System.Web.UI.Page
    {
        /// <summary>
        /// Whether the user is authenticated
        /// </summary>
        protected bool IsUserAuthenticated { get; set; }

        /// <summary>
        /// Current user id if authenticated
        /// </summary>
        protected int UserId { get; set; }

        /// <summary>
        /// Current user name if authenticated
        /// </summary>
        protected string UserName { get; set; }

        /// <summary>
        /// Current user profile picture url if authencated
        /// </summary>
        protected string UserProfilePictureUrl { get; set; }

        protected void Page_Load(object sender, EventArgs e)
        {
            var existingUser = ChatCookieHelperStub.GetDbUserFromCookie(new HttpRequestWrapper(this.Request));
            if (existingUser != null)
            {
                if (!ChatHub.IsUserRegisteredInDbUsersStub(existingUser))
                {
                    // cookie is invalid
                    ChatCookieHelperStub.RemoveCookie(new HttpResponseWrapper(this.Response));
                    // redirects the user to the same page
                    this.Response.Redirect("/Home/Index.aspx");
                }

                // in this case the authentication cookie is valid and we must render the chat
                IsUserAuthenticated = true;
                UserId = existingUser.Id;
                UserName = existingUser.FullName;
                UserProfilePictureUrl = GravatarHelper.GetGravatarUrl(GravatarHelper.GetGravatarHash(existingUser.Email), GravatarHelper.Size.s32);
            }
        }
    }
}