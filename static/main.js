
$(document).ready(function() {
  var max_fields = 5;
  var wrapper = $(".input_fields_wrap");
  var add_button = $("#add_field_button");
  var results_wrapper = $("#results_wrapper");

  var findform = $('#findform');
  var saveform = $('#saveform');

  var field_num = 1;

  $(add_button).click(function(e) {
    e.preventDefault();
    if(field_num < max_fields){
      field_num++;
      $(wrapper).append('<div class="ui action input"><input type="text" name="urlinput"/><button class="ui icon button remove_field"><i class="remove icon"></i></button></div>');
      // $('#urlinputdiv').clone().appendTo(wrapper);
    }
  });

  $(wrapper).on("click", ".remove_field", function(e) {
    e.preventDefault();
    if (field_num >= 2){
      field_num--;
      $(this).parent('div').remove();
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

    $.ajax({
      url: $(findform).attr('action'),
      data: formdata,
      type: "POST",
      success: function (response) {
        $(results_wrapper).empty();
        $('.messagebox').empty();

        if (response.excluded.length >= 1){
          console.log(response.excluded);

          $('.messagebox').append('<p>URLs from the following domains are excluded:</p>')
          for (var i = 0; i < response.excluded.length; i++){
            $('.messagebox').append('<p>' + response.excluded[i] + '</p>');
          }
        }

        if (response.not_found.length >= 1){
          console.log(response.not_found);

          $('.messagebox').append('<p>No RSS feeds found at URL(s):</p>')
          for (var i = 0; i < response.not_found.length; i++){
            $('.messagebox').append('<p>' + response.not_found[i] + '</p>');
          }
        }

        for (var i = 0; i < response.result.length; i++){
          $(results_wrapper).append('<div class="item"><div class="ui checkbox"><input type="checkbox" class="feedinput"><label>'+response.result[i]+'</label></div></div>');
        }
      },
      error: function(error){
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
        $('.messagebox').empty();
        $('.messagebox').append('<p>'+response.subscribed+'</p>');
      },
      error: function (error) {
        console.log(error);
      }
    });
  });
});
