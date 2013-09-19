<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Index.aspx.cs" Inherits="ChatJsWebFormsSample.Home.Index" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
    <script src="/Scripts/jquery-1.8.1.min.js" type="text/javascript"></script>
    <script src="/Bootstrap/js/bootstrap.min.js" type="text/javascript"></script>
    <script src="/Scripts/jquery.signalR-1.1.2.min.js"></script>
    <script src="/signalr/hubs" type="text/javascript"></script>
    <script src="/ChatJs/Scripts/jquery.activity-indicator-1.0.0.min.js" type="text/javascript"></script>
    <script src="/ChatJs/Scripts/jquery.chatjs.signalradapter.js" type="text/javascript"></script>
    <script src="/ChatJs/Scripts/jquery.chatjs.js" type="text/javascript"></script>
    <script src="/Scripts/scripts.js" type="text/javascript"></script>
    <script src="https://google-code-prettify.googlecode.com/svn/loader/run_prettify.js"></script>
    <!--Styles-->
    <link rel="stylesheet" type="text/css" href="/ChatJs/Styles/jquery.chatjs.css" />
    <link rel="stylesheet" type="text/css" href="/Bootstrap/css/bootstrap.min.css" />
    <link rel="stylesheet" type="text/css" href="/Bootstrap/css/bootstrap-responsive.min.css" />

    <% if (this.IsUserAuthenticated)
       { %>
    <script type="text/javascript">
        $(function () {
            $.chat({
                // your user information
                user: {
                    Id: <%= this.UserId %>,
                    Name: '<%= this.UserName %>',
                    ProfilePictureUrl: '<%= this.UserProfilePictureUrl %>'
                },
                // text displayed when the other user is typing
                typingText: ' is typing...',
                // the title for the user's list window
                titleText: 'Chat',
                // text displayed when there's no other users in the room
                emptyRoomText: "There's no one around here. You can still open a session in another browser and chat with yourself :)",
                // the adapter you are using
                adapter: new SignalRAdapter()
            });
        });
    </script>
    <% } %>
</head>
<body>
    <div>
    </div>
    <% if (this.IsUserAuthenticated)
       { %>

    <a id="leaveChatButton" href="#" class="btn btn-warning btn-large">Leave demo chat</a>
    <% }
       else
       { %>
        <a id="joinChatButton" href="#" class="btn btn-info btn-large">Join public demo chat</a>
    <% } %>
    <!-- Modal -->
    <div id="loginModal" class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
        <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal" aria-hidden="true">Ã—</button>
            <h3 id="myModalLabel">Join demo chat</h3>
        </div>
        <div class="modal-body">
            <p>You are joining the demo chat. There's no need to register, just pass in some information so we can display in the chat window. The e-mail is just so that we can display your picture. It won't be stored.</p>
            <form class="form-horizontal">
                <div class="control-group">
                    <label class="control-label" for="userName">User Display Name</label>
                    <div class="controls">
                        <input type="text" id="userName" placeholder="The way other users will see you." class="input-xlarge">
                    </div>
                </div>
                <div class="control-group">
                    <label class="control-label" for="email">E-mail</label>
                    <div class="controls">
                        <input type="text" id="email" placeholder="For Gravatar use only. Will not be stored." class="input-xlarge">
                    </div>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button id="joinChatConclusionButton" class="btn btn-primary" type="button">Join chat</button>
            <button class="btn" data-dismiss="modal" aria-hidden="true">Cancel</button>
        </div>
    </div>
</body>
</html>
