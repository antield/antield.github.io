import '@material/web/switch/switch.js';
import * as AssistTool from "../module/assistTool.js";
import * as LoginModule from "../part/login.js";

function getTokenStr() {
  return LoginModule.getTokenStr();
}

function uploadImage(formData, imgElement, inputHidden) {
  let url = poiManageApiUrl + "sys/file/upload-image";
  let invokeBefore = function () {
    return fetch(url, {
      method: 'POST',
      headers: new Headers({
        'Authorization': getTokenStr(),
      }),
      body: formData,
    }).then(AssistTool.checkRespOkToJson);
  };
  let invokeAfter = function (resultObj) {
    resultObj = AssistTool.regulateRestResult(resultObj);
    if (!resultObj.success) {
      AssistTool.showMessageTip(resultObj.message);
      return;
    }
    let picUrl = resultObj.data;
    imgElement.src = poiManageApiUrl + picUrl;
    inputHidden.value = picUrl;
  };
  LoginModule.fetchAndCheck(invokeBefore, invokeAfter);
}

function initData() {

}

document.addEventListener("DOMContentLoaded", function () {
  let afterLogin = function (loginResult) {
    if (loginResult) {
      initData();
    }
  };
  LoginModule.init(afterLogin, false, "loginBar");
});

window.AssistTool = AssistTool;
