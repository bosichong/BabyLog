$(document).ready(function () {
    $("img").addClass("img-fluid")


    // 自动关闭提示框
    setTimeout("timerCloseAlert()",2000);


});


function timerCloseAlert(){
    $(".alert").hide()
}