/**
 * ChatJS 1.0 - MIT License
 * www.chatjs.net
 * 
 * Copyright (c) 2013, André Pena
 * All rights reserved.
 *
 **/

// CHAT CONTAINER
(function ($) {
    function ChatContainer(options) {
        /// <summary>This is a window container, responsible for hosting both the users list and the chat window </summary>
        /// <param name="options" type=""></param>

        this.defaults = {
            objectType: null,
            objectName: null,
            title: null,
            canClose: true,
            showTextBox: true,
            initialToggleState: "maximized",
            onCreated: function (chatContainer) { },
            onClose: function (chatContainer) { },
            // triggers when the window changes it's state: minimized or maximized
            onToggleStateChanged: function (currentState) { }
        };

        //Extending options:
        this.opts = $.extend({}, this.defaults, options);

        //Privates:
        this.$el = null;
        this.$window = null;
        this.$windowTitle = null;
        this.$windowContent = null;
        this.$windowInnerContent = null;
        this.$textBox = null;
    }

    // Separate functionality from object creation
    ChatContainer.prototype = {

        init: function () {
            var _this = this;

            // container
            _this.$window = $("<div/>").addClass("chat-window").appendTo($("body"));

            // title
            _this.$windowTitle = $("<div/>").addClass("chat-window-title").appendTo(_this.$window);
            if (_this.opts.canClose) {
                var $closeButton = $("<div/>").addClass("close").appendTo(_this.$windowTitle);
                $closeButton.click(function (e) {
                    e.stopPropagation();

                    // removes this item from the collection
                    for (var i = 0; i < $._chatContainers.length; i++) {
                        if ($._chatContainers[i] == _this) {
                            $._chatContainers.splice(i, 1);
                            break;
                        }
                    }

                    // removes the window
                    _this.$window.remove();

                    // triggers the event
                    _this.opts.onClose(_this);
                });

            }

            $("<div/>").addClass("text").text(_this.opts.title).appendTo(_this.$windowTitle);

            // content
            _this.$windowContent = $("<div/>").addClass("chat-window-content").appendTo(_this.$window);
            if (_this.opts.initialToggleState == "minimized")
                _this.$windowContent.hide();

            _this.$windowInnerContent = $("<div/>").addClass("chat-window-inner-content").appendTo(_this.$windowContent);

            // text-box-wrapper
            if (_this.opts.showTextBox) {
                var $windowTextBoxWrapper = $("<div/>").addClass("chat-window-text-box-wrapper").appendTo(_this.$windowContent);
                _this.$textBox = $("<textarea rows='1'/>").addClass("chat-window-text-box").appendTo($windowTextBoxWrapper);
                _this.$textBox.autosize();
            }

            // wire everything up
            _this.$windowTitle.click(function () {
                _this.$windowContent.toggle();
                if (_this.$windowContent.is(":visible") && _this.opts.showTextBox)
                    _this.$textBox.focus();
                _this.opts.onToggleStateChanged(_this.$windowContent.is(":visible") ? "maximized" : "minimized");
            });

            // enlists this container in the containers
            if (!$._chatContainers)
                $._chatContainers = new Array();
            $._chatContainers.push(_this);

            $.organizeChatContainers();

            _this.opts.onCreated(_this);
        },

        getContent: function () {
            /// <summary>Gets the content of the chat window. This HTML element is the container for any chat window content</summary>
            /// <returns type="Object"></returns>
            var _this = this;
            return _this.$windowInnerContent;
        },

        setTitle: function (title) {
            var _this = this;
            $("div[class=text]", _this.$windowTitle).text(title);
        },

        setVisible: function (visible) {
            /// <summary>Sets the window visible or not</summary>
            /// <param name="visible" type="Boolean">Whether it's visible</param>
            var _this = this;
            if (visible)
                _this.$window.show();
            else
                _this.$window.hide();
        },

        getToggleState: function () {
            var _this = this;
            return _this.$windowContent.is(":visible") ? "maximized" : "minimized";
        },

        setToggleState: function (state) {
            var _this = this;
            if (state == "minimized")
                _this.$windowContent.hide();
            else if (state == "maximized")
                _this.$windowContent.show();
        }
    };

    // The actual plugin
    $.chatContainer = function (options) {
        var chatContainer = new ChatContainer(options);
        chatContainer.init();

        return chatContainer;
    };

    $.organizeChatContainers = function () {
        // this is the initial right offset
        var rightOffset = 10;
        var deltaOffset = 10;
        for (var i = 0; i < $._chatContainers.length; i++) {
            $._chatContainers[i].$window.css("right", rightOffset);
            rightOffset += $._chatContainers[i].$window.outerWidth() + deltaOffset;
        }
    };

})(jQuery);


// CHAT WINDOW
(function ($) {

    function ChatWindow(options) {
        /// <summary>This is the chat window for a user.. contains the chat messages</summary>
        /// <param name="options" type="Object"></param>
        // Defaults:
        this.defaults = {
            myUser: null,
            otherUser: null,
            typingText: null,
            initialToggleState: "maximized",
            initialFocusState: "focused",
            userIsOnline: false,
            adapter: null,
            onReady: function () { },
            onClose: function (container) { },
            // triggers when the window changes it's state: minimized or maximized
            onToggleStateChanged: function (currentState) { }
        };

        //Extending options:
        this.opts = $.extend({}, this.defaults, options);

        //Privates:
        this.$el = null;
        this.chatContainer = null;

        this.addMessage = function (message, clientGuid) {
            var _this = this;
            _this.chatContainer.setToggleState("maximized");

            if (message.UserFrom.Id != this.opts.myUser.Id) {
                // the message did not came from myself. Better erase the typing signal
                _this.removeTypingSignal();
            }

            // takes a jQuery element and replace it's content that seems like an URL with an
            // actual link or e-mail
            function linkify($element) {
                var inputText = $element.html();
                var replacedText, replacePattern1, replacePattern2, replacePattern3;

                //URLs starting with http://, https://, or ftp://
                replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
                replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

                //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
                replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
                replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

                //Change email addresses to mailto:: links.
                replacePattern3 = /(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/gim;
                replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

                return $element.html(replacedText);
            }

            function emotify($element) {
                var inputText = $element.html();
                var replacedText = inputText;

                var emoticons = [
                    { pattern: ":-\)", cssClass: "happy" },
                    { pattern: ":\)", cssClass: "happy" },
                    { pattern: "=\)", cssClass: "happy" },
                    { pattern: ":-D", cssClass: "very-happy" },
                    { pattern: ":D", cssClass: "very-happy" },
                    { pattern: "=D", cssClass: "very-happy" },
                    { pattern: ":-\(", cssClass: "sad" },
                    { pattern: ":\(", cssClass: "sad" },
                    { pattern: "=\(", cssClass: "sad" },
                    { pattern: ":-\|", cssClass: "wary" },
                    { pattern: ":\|", cssClass: "wary" },
                    { pattern: "=\|", cssClass: "wary" },
                    { pattern: ":-O", cssClass: "astonished" },
                    { pattern: ":O", cssClass: "astonished" },
                    { pattern: "=O", cssClass: "astonished" },
                    { pattern: ":-P", cssClass: "tongue" },
                    { pattern: ":P", cssClass: "tongue" },
                    { pattern: "=P", cssClass: "tongue" }
                ];

                for (var i = 0; i < emoticons.length; i++) {
                    replacedText = replacedText.replace(emoticons[i].pattern, "<span class='" + emoticons[i].cssClass + "'></span>");
                }

                return $element.html(replacedText);
            }

            if (message.ClientGuid && $("p[data-val-client-guid='" + message.ClientGuid + "']").length) {
                // in this case, this message is comming from the server AND the current user POSTED the message.
                // so he/she already has this message in the list. We DO NOT need to add the message.
                $("p[data-val-client-guid='" + message.ClientGuid + "']").removeClass("temp-message").removeAttr("data-val-client-guid");
            } else {
                var $messageP = $("<p/>").text(message.Message);
                if (clientGuid)
                    $messageP.attr("data-val-client-guid", clientGuid).addClass("temp-message");

                linkify($messageP);
                emotify($messageP);

                // gets the last message to see if it's possible to just append the text
                var $lastMessage = $("div.chat-message:last", _this.chatContainer.$windowInnerContent);
                if ($lastMessage.length && $lastMessage.attr("data-val-user-from") == message.UserFrom.Id) {
                    // we can just append text then
                    $messageP.appendTo($(".chat-text-wrapper", $lastMessage));
                }
                else {
                    // in this case we need to create a whole new message
                    var $chatMessage = $("<div/>").addClass("chat-message").attr("data-val-user-from", message.UserFrom.Id);
                    $chatMessage.appendTo(_this.chatContainer.$windowInnerContent);

                    var $gravatarWrapper = $("<div/>").addClass("chat-gravatar-wrapper").appendTo($chatMessage);
                    var $textWrapper = $("<div/>").addClass("chat-text-wrapper").appendTo($chatMessage);

                    // add text
                    $messageP.appendTo($textWrapper);

                    // add image
                    $("<img/>").attr("src", decodeURI(message.UserFrom.ProfilePictureUrl)).appendTo($gravatarWrapper);
                }

                // scroll to the bottom
                _this.chatContainer.$windowInnerContent.scrollTop(_this.chatContainer.$windowInnerContent[0].scrollHeight);
            }
        };

        this.sendMessage = function (messageText) {
            /// <summary>Sends a message to the other user</summary>
            /// <param name="messageText" type="String">Message being sent</param>
            var _this = this;

            var generateGuidPart = function () {
                return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
            };

            var clientGuid = (generateGuidPart() + generateGuidPart() + '-' + generateGuidPart() + '-' + generateGuidPart() + '-' + generateGuidPart() + '-' + generateGuidPart() + generateGuidPart() + generateGuidPart());
            _this.addMessage({
                UserFrom: _this.opts.myUser,
                Message: messageText
            }, clientGuid);

            _this.opts.adapter.server.sendMessage(_this.opts.otherUser.Id, messageText, clientGuid);
        };

        this.sendTypingSignal = function () {
            /// <summary>Sends a typing signal to the other user</summary>
            var _this = this;
            _this.opts.adapter.server.sendTypingSignal(_this.opts.otherUser.Id);
        };

        this.getToggleState = function () {
            var _this = this;
            return _this.chatContainer.getToggleState();
        };

        this.setVisible = function (value) {
            var _this = this;
            _this.chatContainer.setVisible(value);
        };
    }

    // Separate functionality from object creation
    ChatWindow.prototype = {

        init: function () {
            var _this = this;

            _this.chatContainer = $.chatContainer({
                title: _this.opts.userToName,
                canClose: true,
                initialToggleState: _this.opts.initialToggleState,
                onClose: function (e) {
                    _this.opts.onClose(e);
                },
                onToggleStateChanged: function (toggleState) {
                    _this.opts.onToggleStateChanged(toggleState);
                }
            });

            _this.chatContainer.$textBox.keypress(function (e) {
                // if a send typing signal is in course, remove it and create another
                if (_this.$sendTypingSignalTimeout == undefined) {
                    _this.$sendTypingSignalTimeout = setTimeout(function () {
                        _this.$sendTypingSignalTimeout = undefined;
                    }, 3000);
                    _this.sendTypingSignal();
                }

                if (e.which == 13) {
                    e.preventDefault();
                    if ($(this).val()) {
                        _this.sendMessage($(this).val());
                        $(this).val('').trigger("autosize.resize");
                    }
                }
            });

            _this.chatContainer.setTitle(_this.opts.otherUser.Name);

            _this.opts.adapter.server.getMessageHistory(_this.opts.otherUser.Id, function (messageHistory) {
                for (var i = 0; i < messageHistory.length; i++)
                    _this.addMessage(messageHistory[i]);

                _this.chatContainer.setVisible(true);

                if (_this.opts.initialFocusState == "focused")
                    _this.chatContainer.$textBox.focus();

                // scroll to the bottom
                _this.chatContainer.$windowInnerContent.scrollTop(_this.chatContainer.$windowInnerContent[0].scrollHeight);

                if (_this.opts.onReady)
                    _this.opts.onReady(_this);
            });

            _this.setOnlineStatus(_this.opts.userIsOnline);
        },

        focus: function () {
            var _this = this;
            _this.chatContainer.$textBox.focus();
        },

        showTypingSignal: function (user) {
            /// <summary>Adds a typing signal to this window. It means the other user is typing</summary>
            /// <param name="user" type="Object">the other user info</param>
            var _this = this;
            if (_this.$typingSignal)
                _this.$typingSignal.remove();
            _this.$typingSignal = $("<p/>").addClass("typing-signal").text(user.Name + _this.opts.typingText);
            _this.chatContainer.$windowInnerContent.after(_this.$typingSignal);
            if (_this.typingSignalTimeout)
                clearTimeout(_this.typingSignalTimeout);
            _this.typingSignalTimeout = setTimeout(function () {
                _this.removeTypingSignal();
            }, 5000);
        },

        removeTypingSignal: function () {
            /// <summary>Remove the typing signal, if it exists</summary>
            var _this = this;
            if (_this.$typingSignal)
                _this.$typingSignal.remove();
            if (_this.typingSignalTimeout)
                clearTimeout(_this.typingSignalTimeout);
        },

        setOnlineStatus: function (userIsOnline) {
            var _this = this;
            if (userIsOnline) {
                _this.chatContainer.$windowTitle.addClass("online");
                _this.chatContainer.$windowTitle.removeClass("offline");
            } else {
                _this.chatContainer.$windowTitle.removeClass("online");
                _this.chatContainer.$windowTitle.addClass("offline");
            }
        }
    };

    // The actual plugin
    $.chatWindow = function (options) {
        var chatWindow = new ChatWindow(options);
        chatWindow.init();

        return chatWindow;
    };
})(jQuery);

// CHAT
(function ($) {

    // creates a chat user-list
    function Chat(options) {
        var _this = this;

        // Defaults:
        _this.defaults = {
            user: null,
            adapter: null,
            titleText: 'Chat',
            emptyRoomText: "There's no other users",
            typingText: " is typing...",
            useActivityIndicatorPlugin: true,
            playSound: true
        };

        //Extending options:
        _this.opts = $.extend({}, _this.defaults, options);

        //Privates:
        _this.$el = null;

        // there will be one property on this object for each user in the chat
        // the property name is the other user id (toStringed)
        _this.chatWindows = new Object();
        _this.lastMessageCheckTimeStamp = null;
        _this.chatContainer = null;

        _this.createCookie = function (name, value, days) {
            var expires;
            if (days) {
                var date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toGMTString();
            } else {
                expires = "";
            }
            document.cookie = name + "=" + value + expires + "; path=/";
        };

        _this.readCookie = function (name) {
            var nameEq = name + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEq) == 0) return c.substring(nameEq.length, c.length);
            }
            return null;
        };

        _this.eraseCookie = function (name) {
            _this.createCookie(name, "", -1);
        };

        _this.createNewChatWindow = function (otherUser, initialToggleState, initialFocusState) {

            if (!initialToggleState)
                initialToggleState = "maximized";

            if (!initialFocusState)
                initialFocusState = "focused";

            // if this particular chat-window does not exist yet, create it
            var newChatWindow = $.chatWindow({
                myUser: _this.opts.user,
                otherUser: otherUser,
                newMessageUrl: _this.opts.newMessageUrl,
                messageHistoryUrl: _this.opts.messageHistoryUrl,
                initialToggleState: initialToggleState,
                initialFocusState: initialFocusState,
                userIsOnline: otherUser.Status == 1,
                adapter: _this.opts.adapter,
                typingText: _this.opts.typingText,
                onClose: function () {
                    delete _this.chatWindows[otherUser.Id];
                    $.organizeChatContainers();
                    _this.saveWindows();
                },
                onToggleStateChanged: function (toggleState) {
                    _this.saveWindows();
                }
            });

            // this cannot be in t
            _this.chatWindows[otherUser.Id.toString()] = newChatWindow;
            _this.saveWindows();
        };


        _this.processUserListAjaxResult = function (data) {
            /// <summary>Handles the list of users coming from the server</summary>
            /// <param name="data" type="Array">List of users</param>
            var _this = this;
            _this.chatContainer.getContent().html('');
            if (data.length <= 1) {
                $("<div/>").addClass("user-list-empty").text(_this.opts.emptyRoomText).appendTo(_this.chatContainer.getContent());
            }
            else {
                var indexedData = new Object();
                for (var i = 0; i < data.length; i++) {
                    if (data[i].Id != _this.opts.user.Id) {
                        indexedData[data[i].Id] = data[i];
                        var $userListItem = $("<div/>")
                            .addClass("user-list-item")
                            .attr("data-val-id", data[i].Id)
                            .appendTo(_this.chatContainer.getContent());

                        $("<img/>")
                            .addClass("profile-picture")
                            .attr("src", data[i].ProfilePictureUrl)
                            .appendTo($userListItem);

                        $("<div/>")
                            .addClass("profile-status")
                            .addClass(data[i].Status == 0 ? "offline" : "online")
                            .appendTo($userListItem);

                        $("<div/>")
                            .addClass("content")
                            .text(data[i].Name)
                            .appendTo($userListItem);

                        // makes a click in the user to either create a new chat window or open an existing
                        // I must clusure the 'i'
                        (function (otherUserId) {
                            // handles clicking in a user. Starts up a new chat session
                            $userListItem.click(function () {
                                if (_this.chatWindows[data[otherUserId].Id]) {
                                    _this.chatWindows[data[otherUserId].Id].focus();
                                } else
                                    _this.createNewChatWindow(data[otherUserId]);
                            });
                        })(i);
                    }
                }
            }

            // update the online status of the remaining windows
            for (var i in _this.chatWindows) {
                if (indexedData && indexedData[i])
                    _this.chatWindows[i].setOnlineStatus(indexedData[i].Status == 1);
                else
                    _this.chatWindows[i].setOnlineStatus(false);
            }

            _this.chatContainer.setVisible(true);
        };

        _this.saveWindows = function () {
            var _this = this;
            var openedChatWindows = new Array();
            for (var otherUserId in _this.chatWindows) {
                openedChatWindows.push({
                    userId: otherUserId,
                    toggleState: _this.chatWindows[otherUserId].getToggleState()
                });
            }
            _this.createCookie("chat_state", JSON.stringify(openedChatWindows), 365);
        };

        _this.loadWindows = function () {
            var _this = this;
            var cookie = _this.readCookie("chat_state");
            if (cookie) {
                var openedChatWindows = JSON.parse(cookie);
                for (var i = 0; i < openedChatWindows.length; i++) {
                    var otherUserId = openedChatWindows[i].userId;
                    _this.opts.adapter.server.getUserInfo(otherUserId, function (user) {
                        if (user) {
                            if (!_this.chatWindows[otherUserId])
                                _this.createNewChatWindow(user, null, "blured");
                        } else {
                            // when an error occur, the state of this cookie invalid
                            // it must be destroyed
                            _this.eraseCookie("chat_state");
                        }
                    });
                }
            }
        };

        _this.playSound = function (filename) {
            /// <summary>Plays a notification sound</summary>
            /// <param name="filename" type="String">The file path without extension</param>
            var $soundContainer = $("#soundContainer");
            if (!$soundContainer.length)
                $soundContainer = $("<div>").attr("id", "soundContainer").appendTo($("body"));
            $soundContainer.html('<audio autoplay="autoplay"><source src="' + filename + '.mp3" type="audio/mpeg" /><source src="' + filename + '.ogg" type="audio/ogg" /><embed hidden="true" autostart="true" loop="false" src="' + filename + '.mp3" /></audio>');
        };


    }

    // Separate functionality from object creation
    Chat.prototype = {

        init: function () {
            var _this = this;

            var mainChatWindowChatState = _this.readCookie("main_window_chat_state");
            if (!mainChatWindowChatState)
                mainChatWindowChatState = "maximized";

            // will create user list chat container
            _this.chatContainer = $.chatContainer({
                title: _this.opts.titleText,
                showTextBox: false,
                canClose: false,
                initialToggleState: mainChatWindowChatState,
                onCreated: function (container) {
                    if (!container.$windowInnerContent.html()) {
                        var $loadingBox = $("<div/>").addClass("loading-box").appendTo(container.$windowInnerContent);
                        if (_this.opts.useActivityIndicatorPlugin) {
                            $loadingBox.activity({ segments: 8, width: 3, space: 0, length: 3, color: '#666666', speed: 1.5 });
                        }
                    }
                },
                onToggleStateChanged: function (toggleState) {
                    _this.createCookie("main_window_chat_state", toggleState);
                }
            });

            _this.client = new Object();

            // the client functions are functions that must be called by the chat-adapter to interact
            // with the chat
            _this.client.sendMessage = function (message) {
                /// <summary>Called by the adapter when the OTHER user sends a message to the current user</summary>
                /// <param name="message" type="Object">Message object</param>
                if (message.UserFrom.Id != _this.opts.user.Id) {
                    // in this case this message did not came from myself
                    if (!_this.chatWindows[message.UserFrom.Id])
                        _this.createNewChatWindow(message.UserFrom);
                    else
                        _this.chatWindows[message.UserFrom.Id].addMessage(message);

                    if (_this.opts.playSound) {
                        _this.playSound("/chatjs/sounds/chat");
                    }

                    // play sound here
                } else {
                    if (_this.chatWindows[message.UserTo.Id]) {
                        _this.chatWindows[message.UserTo.Id].addMessage(message);
                    }
                }
            };

            _this.client.sendTypingSignal = function (otherUser) {
                /// <summary>Called by the adapter when the OTHER user is sending a typing signal to the current user</summary>
                /// <param name="otherUser" type="Object">User object (the other sending the typing signal)</param>
                if (_this.chatWindows[otherUser.Id]) {
                    _this.chatWindows[otherUser.Id].showTypingSignal(otherUser);
                }
            };

            _this.client.usersListChanged = function (usersList) {
                /// <summary>Called by the adapter when the users list changes</summary>
                /// <param name="usersList" type="Object">The new user list</param>
                _this.processUserListAjaxResult(usersList);
            };

            _this.onReady = function (usersList) {
                /// <summary>Called by the adapter when all the adapter initialization is done already</summary>
                /// <param name="usersList" type=""></param>
                _this.loadWindows();
            };

            _this.opts.adapter.init(_this);
        }
    };

    // The actual plugin
    $.chat = function (options) {
        var chat = new Chat(options);
        chat.init();
        return chat;
    };
})(jQuery);

// creates a chat user-list

