/*
  date store today date.
  d store today date.
  m store current month.
  y store current year.
*/
var current_datetime = new Date();
var d    = current_datetime.getDate();
var m    = current_datetime.getMonth();
var y    = current_datetime.getFullYear();
// console.log(date);
var allday     = false;
var event_list = [];
var keyId;

// jQuery
$(document).ready(function() {
  $('#details').val('');

  setTimeout(loadEvents, 1000);
  setTimeout(loadCalTable, 2000);

  $(document).on('change', '#allday', () => { allday = !allday });
  $(document).on('click', '#cls-cal-btn', clearModal); //關
  $(document).on('click', '#signout-btn', logout); //登出
});


function loadCalTable() {
  /*
		Initialize fullCalendar and store into variable.
		Why in variable?
		Because doing so we can use it inside other function.
		In order to modify its option later.
	*/

	var calendar = $('#calendar').fullCalendar({
    defaultDate: current_datetime,
		/*
			header option will define our calendar header.
			left define what will be at left position in calendar
			center define what will be at center position in calendar
			right define what will be at right position in calendar
		*/
		header:
		{
			left: 'prev,next today',
			center: 'title',
			right: 'month,agendaWeek,agendaDay'
		},
		/*
			defaultView option used to define which view to show by default,
			for example we have used agendaWeek.
		*/
		// defaultView: 'agendaWeek',
		/*
			selectable:true will enable user to select datetime slot
			selectHelper will add helpers for selectable.
		*/
    editable: true,
    eventLimit: true, // allow "more" link when too many events,
		selectable: true,
		selectHelper: true,
		/*
			when user select timeslot this option code will execute.
			It has three arguments. Start,end and allDay.
			Start means starting time of event.
			End means ending time of event.
			allDay means if events is for entire day or not.
		*/
		select: (start, end, jsEvent, view) => {

      let convert_start = convertTime(start._d);
      let convert_end = convertTime(end._d);

      // console.log(start._d, end._d);
      // console.log(convert_start, convert_end);
      // console.log(new_start, new_end);

      // 錯誤訊息隱藏
      $('#cal-error-msg').hide();
      $('#tim-error-msg').hide();
      // 新增視窗
      $('#myModal').modal('show');
      // 按鈕設定
      $('#add-cal-btn').show();
      $('#save-cal-btn').hide();
      $('#del-cal-btn').hide();
      // 時間input設定
      $('#startDate').val(convert_start); //
      $('#endDate').val(convert_end); //

			$(document).on('click', '#add-cal-btn', () => {
        let title      = $('#title').val();
        let start_date = $('#startDate').val();
        let end_date   = $('#endDate').val();
        let userId     = auth.currentUser.uid;
        // console.log( typeof(Date.parse(start_date)), Date.parse(end_date) );

        if(title !== '' && start_date !== ''){
          if(Date.parse(end_date) > Date.parse(start_date)){
            // show on calendar
            calendar.fullCalendar('renderEvent',
    					{
    						title: title,
    						start: start_date,
    						end: end_date,
    						allDay: allday
    					},
    					true // make the event "stick"
    				);

            keyId = $('#keyId').text();
            // save data
            if(keyId === ''){
              database.ref('cal-events/' + userId).push({
                title: title,
                start: start_date,
                end: end_date,
                allDay: allday
              });
            } else {
              database.ref('cal-events/' + userId + '/' + keyId).set({
                title: title,
                start: start_date,
                end: end_date,
                allDay: allday
              });
            }
            $('#title').val('');
            $('#startDate').val('');
            $('#endDate').val('');
            $('#myModal').modal('hide');
            $('#add-cal-btn').hide();
          } else {
            $('#tim-error-msg').show();
          }

        } else {
          $('#cal-error-msg').show();
        }

      });
			calendar.fullCalendar('unselect');
      event_list = [];
		},
    /*
			eventClick: edit after click.
		*/
    eventClick: function(event, jsEvent, view) {
      // console.log(event.start._i);

      let userId = auth.currentUser.uid;
      let eventObj = [];
      // 隱藏錯誤訊息
      $('#cal-error-msg').hide();
      $('#tim-error-msg').hide();

      database.ref('cal-events/' + userId).on('value', snap => {
        let eventId  = snap.val();
        let eventKey = Object.keys(eventId);
        for(let i=0;i<eventKey.length;i++){
          database.ref('cal-events/' + userId + '/' + eventKey[i]).on('value', v => {
            eventObj.push(v.val());
            if(eventObj[i].title === event.title){
              keyId = eventKey[i];
            }
          });
        }
      });
      // 資料的值放進對應的input
      $('#keyId').text(keyId);
      $('#title').val(event.title);

      if(event.allDay === true){
        $('#allday').attr('checked', true);
        $('#startDate').val(ISODateString(event.start._d));
      } else {
        // console.log(event.end);
        $('#allday').attr('checked', false);
        $('#startDate').val(event.start._i);
        $('#endDate').val(event.end._i);
      }
      $('#myModal').modal('show');
      $('#save-cal-btn').show();
      $('#del-cal-btn').show();
      $('#add-cal-btn').hide();

      $(document).on('click', '#save-cal-btn', () => {
        let title      = $('#title').val();
        let start_date = $('#startDate').val();
        let end_date   = $('#endDate').val();
        let ad         = $('#allday');

        if(title !== '' && start_date !== ''){
          if(Date.parse(end_date) > Date.parse(start_date)){
            if(ad.is('checked')){
              start_date = ISODateString(start_date);
              end_date   = '';
              calendar.fullCalendar('renderEvent', {
                title: title,
                start: start_date,
                allDay: true
              });
            } else {
              // allday = ad.val();
              calendar.fullCalendar('renderEvent', {
                title: title,
                start: start_date,
                end: end_date,
                allDay: false
              });
            }

            // save data
            let userId = auth.currentUser.uid;
            keyId      = $('#keyId').text();
            database.ref('cal-events/' + userId + '/' + keyId).set({
              title: title,
              start: start_date,
              end: end_date,
              allDay: allday
            });
            // clear the form
            $('#title').val('');
            $('#startDate').val('');
            $('#endDate').val('');
            $('#myModal').modal('hide');
            $('#save-cal-btn').hide();
            $('#cal-error-msg').hide();
            $('#del-cal-btn').hide();

            window.location = '/calendar'
          } else {
            $('#tim-error-msg').show();
          }

        } else {
          $('#cal-error-msg').show();
        }

      });

      $(document).on('click', '#del-cal-btn', () => {
        let userId = auth.currentUser.uid;
        keyId      = $('#keyId').text();
        database.ref('cal-events/' + userId + '/' + keyId).remove();

        window.location = '/calendar';
      });

			calendar.fullCalendar('unselect');
      event_list = [];
    },

    eventDragStop: ( event, jsEvent, ui, view ) => {
      console.log(event, jsEvent, ui, view);
    },
		/*
			editable: true allow user to edit events.
		*/
		editable: true,
		/*
			events is the main option for calendar.
			for demo we have added predefined events in json object.
		*/
		events: event_list,

    eventDurationEditable: false
	});
}

function loadEvents() {

  let userId = auth.currentUser.uid;

  database.ref('cal-events/' + userId).on('value', snap => {
    let eventContent = snap.val();
    let eventKey = Object.keys(eventContent);
    // console.log(eventKey.length);
    for(var i=0;i<eventKey.length;i++){
      database.ref('cal-events/' + userId + '/' + eventKey[i]).on('value', snap => {
        // console.log(snap.val());
        event_list.push(snap.val());
      });
    }
    // console.log(event_list);
  });
}

function clearModal() {
  $('#keyId').text('');
  $('#title').val('');
  $('#startDate').val('');
  $('#endDate').val('');
  $('#allday').attr('checked', false);
}

function ISODateString(d) {
    function pad(n) {return n<10 ? '0'+n : n}
    return d.getFullYear()+'-'
         + pad(d.getMonth()+1)+'-'
         + pad(d.getDate())+'T'
         + '00:00'
}

function ISODateTimeString(d) {
    function pad(n) {return n<10 ? '0'+n : n}
    return d.getFullYear()+'-'
         + pad(d.getMonth()+1)+'-'
         + pad(d.getDate())+'T'
         + pad(d.getHours())+':'
         + pad(d.getMinutes())
}

// function convertUTCDateToLocalDate(date) {
//     var newDate = new Date(date.getTime()+date.getTimezoneOffset()*60*1000);
//
//     var offset = date.getTimezoneOffset() / 60;
//     console.log(offset);
//     var hours = date.getHours();//動到小時這一塊時間上才會是正確的
//     console.log(hours, offset);
//
//     newDate.setHours(hours - offset);
//
//     return newDate;
// }

function convertTime(date) {
    let newDate = new Date(date.getTime()+date.getTimezoneOffset()*60*1000);
    let finalDate = ISODateTimeString(newDate);

    return finalDate;
}
