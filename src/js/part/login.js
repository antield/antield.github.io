import * as AssistTool from "../module/assistTool.js";
import '@material/web/textfield/outlined-text-field.js';
// import '@material/web/button/filled-button.js';
// import '@material/web/icon/icon.js';
// import '@material/web/iconbutton/icon-button.js';

let loginBoard = null;
let loginedInfoBar = null;
let needLoginInfoBar = null;
let loginResultTip = null;

let loginBoardDialog = null;
let loginPromise = null;

let token = null;

let goOnPromiseList = [];

export function getTokenStr() {
  return token || "";
}

export let loginedUserInfo = null;

export function checkLogin() {
  let tokenInStorage = localStorage.getItem("token");
  if (tokenInStorage == null) {
    return openBoardPromise();
  } else {
    token = tokenInStorage;
    let userInfoStr = localStorage.getItem("userInfo");
    let userInfo = JSON.parse(userInfoStr);
    loginedUserInfo = userInfo;
    showLoginedInfoBar(userInfo);
    return Promise.resolve(true);
  }
}

export function reLogin() {
  return openBoardPromise("当前登录已失效，请重新登录");
}

function openBoardPromise(tip) {
  if (loginBoardDialog == null || !loginBoardDialog.open) {
    loginBoard.style.display = "block";
    if (loginBoardDialog == null)
      loginBoardDialog = AssistTool.showMessageDialog(loginBoard);
    if (!loginBoardDialog.open)
      loginBoardDialog.showModal();
    loginPromise = new Promise(function (resolve, reject) {
      let form = loginBoard.querySelector("form");
      form.onchange = function () {
        loginResultTip.textContent = "";
      };
      form.onsubmit = function () {
        loginSubmit(this, resolve);
      };
    });
  }
  if (tip != null)
    loginResultTip.textContent = tip;
  return loginPromise;
}

function loginSubmit(form, resolve) {
  let formData = new FormData(form);
  let username = formData.get("username").trim();
  if (username == "") {
    AssistTool.showMessageTip("请输入用户名");
    return;
  }
  let password = formData.get("password").trim();
  if (password == "") {
    AssistTool.showMessageTip("请输入密码");
    return;
  }
  let contentObj = {
    username,
    password,
  };

  let url = poiManageApiUrl + "auth/login";
  fetch(url, {
    method: 'POST',
    body: JSON.stringify(contentObj),
    headers: new Headers({
      'Content-Type': 'application/json',
    })
  }).then(AssistTool.checkRespOkToJson).then(function (resultObj) {
    resultObj = AssistTool.regulateRestResult(resultObj);
    if (!resultObj.success) {
      loginResultTip.textContent = resultObj.message;
      return;
    }
    token = resultObj.data;
    localStorage.setItem("token", token);
    console.log("登录成功。");
    loginBoardDialog.close();
    resolve(true);
    showLoginedInfoBar();
  }, function (error) {
    console.error('登录请求错误:', error);
  });
}

function showLoginedInfoBar(userInfo) {
  if (userInfo != null) {
    let nicknameSpan = loginedInfoBar.querySelector(".nickname");
    nicknameSpan.textContent = userInfo.nickname;
    loginedInfoBar.style.display = "block";
    needLoginInfoBar.style.display = "none";
  } else {
    let url = poiManageApiUrl + "auth/self-info";
    let invokeBefore = function () {
      return fetch(url, {
        method: 'GET',
        headers: new Headers({
          'Content-Type': 'application/json',
          'Authorization': getTokenStr(),
        })
      }).then(AssistTool.checkRespOkToJson);
    };
    let invokeAfter = function (resultObj) {
      resultObj = AssistTool.regulateRestResult(resultObj);
      if (!resultObj.success) {
        AssistTool.showMessageTip(resultObj.message);
        return;
      }
      userInfo = resultObj.data;
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
      loginedUserInfo = userInfo;
      let nicknameSpan = loginedInfoBar.querySelector(".nickname");
      nicknameSpan.textContent = userInfo.nickname;
      loginedInfoBar.style.display = "block";
      needLoginInfoBar.style.display = "none";
    };
    fetchAndCheck(invokeBefore, invokeAfter);
  }
}

function logout() {
  let url = poiManageApiUrl + "auth/logout";
  fetch(url, {
    method: 'GET',
    headers: new Headers({
      'Content-Type': 'application/json',
      'Authorization': getTokenStr(),
    })
  }).then(AssistTool.checkRespOkToJson).then(function (resultObj) {
    resultObj = AssistTool.regulateRestResult(resultObj);
    if (!resultObj.success) {
      AssistTool.showMessageTip(resultObj.message);
      return;
    }

    clearLoginStorge();
    location.reload();
  }, function (error) {
    console.error('退出请求错误:', error);
  });
}

function clearLoginStorge() {
  localStorage.removeItem("token");
  localStorage.removeItem("userInfo");
  loginedUserInfo = null;
}

export function fetchAndCheck(invokeBefore, invokeAfter) {
  return invokeBefore().then(resultObj => checkResultCode(resultObj, invokeBefore)).then(invokeAfter);
}

export function checkResultCode(resultObj, invokeBefore) {
  if (resultObj.code == 401) {
    clearLoginStorge();
    return reLogin().then(function (loginSuccess) {
      if (loginSuccess) {
        return invokeBefore().then(resultObj => checkResultCode(resultObj, invokeBefore));
      }
    });
  } else {
    return resultObj;
  }
}

export function init(loginBoardId, loginedInfoBarId, needLoginInfoBarId, afterLogin) {
  loginBoard = document.getElementById(loginBoardId);
  loginResultTip = loginBoard.querySelector(".loginResultTip");
  needLoginInfoBar = document.getElementById(needLoginInfoBarId);
  let loginAnchor = needLoginInfoBar.querySelector(".loginAnchor");
  loginAnchor.onclick = function () {
    openBoardPromise().then(afterLogin);
  };
  loginedInfoBar = document.getElementById(loginedInfoBarId);
  let logoutAnchor = loginedInfoBar.querySelector(".logoutAnchor");
  logoutAnchor.onclick = logout;

  checkLogin().then(afterLogin);
}
