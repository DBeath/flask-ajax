
$(document).ready(function() {
  var max_fields = 5;
  var wrapper = $(".input_fields_wrap");
  var add_button = $("#add_field_button");
  var results_wrapper = $("#results_wrapper");
  var messagebox = $("#messagebox");

  var findform = $('#findform');
  var saveform = $('#saveform');
  var saveformdiv =$('.saveformdiv');

  var field_num = 1;

  var clearMessagebox = function(e) {
    $('#messagearea').empty();
  };

  var showMessagebox = function(e) {
    $('#messagearea').removeClass('hidden');
    $('#messagearea').show();
  };

  var addMessageList = function(title, items, id){
    $('#messagearea').append('<div class="ui message messagebox" id="'+id+'"><i class="close icon"></i></div>').html();
    $('#'+id).append('<div class="header">'+title+'</div><ul class="list"></ul>');
    for (var i = 0; i < items.length; i++){
      $('#'+id+' ul.list').append('<li>'+items[i]+'</li>');
    };

    $('#'+id+' .close').on('click', function() {
      $(this)
        .closest('.messagebox').addClass('hidden');
    });
  };

  $(add_button).click(function(e) {
    e.preventDefault();
    if(field_num < max_fields){
      field_num++;
      $(wrapper).append('<div class="field"><div class="ui action input"><input type="text" name="urlinput"/><button class="ui icon button remove_field"><i class="remove icon"></i></button></div></div>');
      // $('#urlinputdiv').clone().appendTo(wrapper);
    }
  });

  $(wrapper).on("click", ".remove_field", function(e) {
    e.preventDefault();
    if (field_num >= 2){
      field_num--;
      $(this).parent('div').remove();
    } else {

    }
  });

  $(findform).submit(function(e) {
    e.preventDefault();
    var formdata = $(findform).serialize();
    var send_data = JSON.stringify(formdata);

    console.log('Get button clicked');
    console.log('URLs: ' + formdata);
    console.log('Findfeeds URL: ' + $(findform).attr('action'));
    console.log('Send_data: ' + send_data);

    $(findform).addClass('loading');
    $(saveformdiv).hide();

    $.ajax({
      url: $(findform).attr('action'),
      data: formdata,
      type: "POST",
      success: function (response) {
        $(results_wrapper).empty();
        clearMessagebox();
        $(findform).removeClass('loading');

        if (response.excluded.length >= 1){
          showMessagebox();
          console.log(response.excluded);

          var title = 'URLs from the following domains are excluded:';
          addMessageList(title, response.excluded, 'excluded');
        }

        if (response.not_found.length >= 1){
          showMessagebox();
          console.log(response.not_found);

          var title = 'No RSS feeds found at URL(s):';
          addMessageList(title, response.not_found, 'notfound');
        }

        if (response.result.length >= 1){
          $(saveformdiv).show();

          for (var i = 0; i < response.result.length; i++){
            var feed = JSON.parse(response.result[i]);
            console.log(feed);
            $(results_wrapper).append('<div class="item"><div class="ui checkbox"><input type="checkbox" class="feedinput"><img class="ui mini image" src="'+feed.site_icon_link+'"><label>'+feed.url+'</label></div></div>');
          };
        };
      },
      error: function(error){
        $(findform).removeClass('loading');
        console.log(error);
      }
    });
  });

  $(saveform).submit(function(e) {
    e.preventDefault();

    var feeds = $('.feedinput').map(function () {
      if($(this).is(':checked')){
        return $(this).next('label').text();
      }
    }).get();

    console.log('Save button clicked');
    console.log('Feeds: ' + feeds);

    var toSend = JSON.stringify(feeds);

    console.log(toSend);

    $.ajax({
      url: $(saveform).attr('action'),
      data: toSend,
      type: 'POST',
      dataType: "json",
      contentType: "application/json;charset=utf-8",
      success: function (response) {
        console.log(response.subscribed);
        clearMessagebox();
        // $('.messagebox').append('<p>'+response.subscribed+'</p>');
        addMessageList('Subscribed to Feeds:', response.subscribed, 'subscribed');
      },
      error: function (error) {
        console.log(error);
      }
    });
  });
});
