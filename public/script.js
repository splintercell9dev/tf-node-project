$(function(){
   let imgContainer = $('div.image-container') ;
   let img = $('#showImage') ;
   let file = $('#inputFile') ;
   file.on('change', function(){

      if ($(this).prop('files')[0]){
         const fr = new FileReader() ;
         fr.onload = function(e){
            img.attr('src', e.target.result) ;
         }

         fr.readAsDataURL($(this).prop('files')[0])
         imgContainer.show() ;
      }
      else{
         imgContainer.hide() ;
         $('#result').hide()
      }
   }) ;

   let submitbtn = $('#submit') ;
   let form = $('#predictForm') ;

   form.on('submit', function(e){
      e.preventDefault() ;
      if (file.prop('files').length == 0){
         alert('There is no file to upload') ;
         return ;
      }
      else{
         submitbtn.prop('disabled', true) ;
         $.ajax({
            type: 'POST',
            url: 'api/predict',
            data: new FormData(document.getElementById('predictForm')),
            enctype: 'multipart/form-data',
            cache: false,
            processData: false,
            contentType: false,
            success: function(data){
               const results = data ;
               let html = '' ;
               $('#result').show() ;
               if (results){
                  $('#result').html(results) ;
               }
               else{
                  $("#fail").show() ;
                  $('#result').html(html) ;
               }
            },
            error: function(data){
               $("#result").hide() ;
               $("#fail").show() ;
               if (data){
                  console.log(data)
               }
            }
         })
         submitbtn.prop('disabled', false) ;
      }
   })
}) ;