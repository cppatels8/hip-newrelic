(function($) {
  
    function showSuccessMessage(message) {
      AJS.messages.success({
        title : "Success!",
        body : message
      });
      HipChat.resize();
    };

    function showErrorMessage(head, message) {
      AJS.messages.error({
        body : message
      });
      HipChat.resize();
    };

    function showWarningMessage(head, message) {
      AJS.messages.warning({
        title : head,
        body : message
      });
      HipChat.resize();
    };
    
    function hideErrorMessage() {
        $("#aui-message-bar").find(".icon-close").click();
    };

    function getResponse(method, url, data) {
        hideErrorMessage();
      return $.ajax({
        type : method,
        url : url,
        data : data
      })
    };

    function showSpinner() {
      $(".waiting-signin").css('z-index', '2');
    }

    function hideSpinner() {
      $(".waiting-signin").css('z-index', '-1');
    }

    function openFeed(pageElement) {
      $('.active').addClass('inactive').removeClass('active');
      $(pageElement).addClass('active').removeClass('inactive');
    }

    function pageView(pageElement) {
      $(pageElement).addClass('inactive').removeClass('active');
    }

    function addFeed(pageData) {
      
      var liNode = $('#pageDetails > .facebook-page').clone();
      $(liNode).data('id',pageData['id']);
      $(liNode).data('url',pageData['url']);
      $('.board-name > span', liNode).html(pageData['name']);
      $('.page-url', liNode).attr('href', pageData['url']);
      $('.page-url', liNode).html(pageData['name']);
      if (("is_personal" in pageData) && !(pageData["is_personal"])){
        $('#comments', liNode).attr('disabled', true);
        $('#replies', liNode).attr('disabled', true);
      }
      $.each(pageData['subscription'], function(index, value) {
        $('#'+value, liNode).attr('checked', true);
      });
      $('.subscribed_board').prepend(liNode);
    }

    var defaultList = [ "posts", "comments", "replies" ];

    function createChecklist(subscriptions) {
      var checklist = "";
      var subscription;
      for (subscription in defaultList) {
        checklist = checklist
            + "<li><input type='checkbox' class='notification-item' value ="
            + defaultList[subscription]
        if (checkSubscription(subscriptions, defaultList[subscription])) {
          checklist = checklist + " checked"
        }
        checklist = checklist + " >"
            + defaultList[subscription].charAt(0).toUpperCase()
            + defaultList[subscription].slice(1) + "</li>"
      }
      return checklist;
    }

    function checkSubscription(subscriptions, index) {
      for (var i = 0; i < subscriptions.length; i++) {
        if (subscriptions[i] == index) {
          return true;
        }
      }
      return false;
    }

    function setErrorMessage(data) {
      message = ("" + data.responseText).replace(/\"/g, '').replace(/\'/g, '')
      if (data.status == 401) {
        message = 'Access revoked. Please reauthorize this integration. <a class="re-auth-link" href = "#" onClick = "window.location.reload(true);">Re-Authenticate</a>'
      }
      else if(data.status == 504){
        message = "<b>Request Timed Out!</b> Try Again!"
      }
      showErrorMessage("Error", "<p>" + message + "</p>");
    }

    var allPages = [];

    function renderTable() {
      showSpinner();
      getResponse('GET', '/api/pages?signed_request=' + signedRequest, {})
          .done(function(data) {
                if (data.length) {
                  allPages = data;
                  $.each(data, function(index, value) {
                    addFeed(value);
                  });
                } else {
                  $('.subscribed_board').html($('#noPageTemplate').html());
                }
              });
      hideSpinner();
    };

    renderTable();

    $("#configForm").submit(function(e) {
      e.preventDefault();
      showSpinner();
      var openFeeds = $('.subscribed_board').find('.blue-bg');
      if (openFeeds.length >= 1) {
        $.each(openFeeds, function(index, value) {
          pageView(value);
        });
      }
      var pageUrl = $.trim($(".facebook_page_url").val()).replace(/\/$/, '');
      $(".facebook_page_url").val('');
      getResponse('POST', '/api/pages?signed_request=' + signedRequest, {'url' : pageUrl})
      .done(function(data) {
        $('.subscribed_board .no-entry-exits-text').remove();
        $('.facebook_page_url').val('');
        allPages.push(data);
        addFeed(data);
        hideSpinner();
        openFeed($('.subscribed_board').children()[0]);
      })
      .error(function(data) {
        hideSpinner();
        setErrorMessage(data);
      });
      $('.subscribed_board').find('.grey-bg').find('.detail-button').remove();
    });

    $(".subscribed_board").on("click", ".edit-button", function(event) {
      event.preventDefault();
      openFeed($(this).parent().parent());
    });

    $(".subscribed_board").on("click", ".done-button", function(event) {
      event.preventDefault();
      showSpinner();
      var pageElement = $(this).parent().parent();
      var pageId = pageElement.data('id');
      page = getPageById(pageId, pageElement);
      getResponse('PUT', '/api/pages?signed_request=' + signedRequest, {
        'page' : JSON.stringify(page)
      })
      .done(function(data) {
        hideSpinner();
      })
      .error(function(data) {
        hideSpinner();
        setErrorMessage(data)
      });
      pageView($(this).parent().parent());
    });

    function getPageById(pageId, pageElement) {
      var subscription = [];
      var k = 0;
      for (page in allPages) {
        if (pageId == allPages[page]['id']) {
          checkList = $(pageElement).find('input.checkbox:checked').not("[disabled]")
          $.each(checkList, function(index, value) {
            subscription.push(checkList[index].name)
            });
          allPages[page]['subscription'] = subscription;
          return allPages[page]
        }
      }
    }


    $("#changeFacebookAccount").click(function(e) {
      e.preventDefault();
      AJS.dialog2("#demo-dialog").show();
    });

    $("#dialog-close-button").click(function(e) {
      e.preventDefault();
      AJS.dialog2("#demo-dialog").hide();
    });

    $("#dialog-signout-button").click(function(e) {
      e.preventDefault();
      hideErrorMessage();
      $.ajax({url : disconnectFacebook})
        .success(function(data) {
          window.location.reload();})
        .error(function(data) {
          showErrorMessage("Error !",
            "Failed to unlink your account. Please refresh the window and try again.");
          });
        AJS.dialog2("#demo-dialog").hide();
      });

    $(".subscribed_board").on("click",".remove-button",function(event) {
          event.preventDefault();
          showSpinner();
          var pageElement = $(this).parent().parent();
          var pageId = pageElement.data('id'), parent = pageElement.parent();
          getResponse('DELETE', '/api/pages?signed_request=' + signedRequest,{'page_id' : pageId})
              .done(function(data) {
                pageElement.remove();
                if (parent.children().length == 0) {
                  $('.subscribed_board').html($('#noPageTemplate').html());
                }
                hideSpinner();
              })
              .error(function(data) {
                hideSpinner();
                setErrorMessage(data)
              });
          });
  })(AJS.$);
