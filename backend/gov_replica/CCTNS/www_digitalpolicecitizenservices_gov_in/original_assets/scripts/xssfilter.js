/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

               
$(document).ready(function() {
   $("input[type=text], textarea").bind("blur", function() {
      if(this.value.search(">") != -1 || this.value.search("<") != -1)
          { 
              fancyWarningWithoutClear($("#commonxssmsg").val(), this.id);
          }
  });

});      


$(document).keydown(function(e){ 
  
  activeObj = document.activeElement;
  var inFocus = false;
  if (activeObj.tagName == "INPUT" || activeObj.tagName == "TEXTAREA")
  {
     inFocus = true;
  }

  if(e.keyCode === 8 && !inFocus){ 
      return false; 
  }; 
  
});

 

