import * as AssistTool from "../module/assistTool.js";

let loginBoard = null;
let loginedInfoBar = null;
let needLoginInfoBar = null;
let loginResultTip = null;

let loginBoardDialog = null;

let registerBoard = null;
let registerBoardDialog = null;

const requireCaptchaMap = {};
const requireCaptchaTimeoutIdMap = {};
let captchaDialog = null;

function keySuffix() {
  return loginSubmitContextPath.replaceAll(/[:/.]+/g, "_");
}

export function getTokenStr() {
  let tokenKey = "token_" + keySuffix();
  let token = localStorage.getItem(tokenKey);
  return token || "";
}
function saveTokenStr(tokenStr) {
  let tokenKey = "token_" + keySuffix();
  localStorage.setItem(tokenKey, tokenStr);
}
function clearTokenStr() {
  let tokenKey = "token_" + keySuffix();
  localStorage.removeItem(tokenKey);
}
function getUserInfo() {
  let userInfoKey = "userInfo_" + keySuffix();
  let userInfoStr = localStorage.getItem(userInfoKey);
  return userInfoStr == null ? null : JSON.parse(userInfoStr);
}
function saveUserInfo(userInfo) {
  let userInfoStr = JSON.stringify(userInfo);
  let userInfoKey = "userInfo_" + keySuffix();
  localStorage.setItem(userInfoKey, userInfoStr);
}
function clearUserInfo() {
  let userInfoKey = "userInfo_" + keySuffix();
  localStorage.removeItem(userInfoKey);
}

export function checkLogin() {
  let tokenStr = getTokenStr();
  if (tokenStr == null || tokenStr == "") {
    return openLoginPromise();
  } else {
    let userInfo = getUserInfo();
    showLoginedInfoBar(userInfo);
    return Promise.resolve(true);
  }
}

function openRegisterPromise(tip) {
  registerBoard.style.display = "block";
  if (registerBoardDialog == null)
    registerBoardDialog = AssistTool.showMessageDialog(registerBoard);
  if (!registerBoardDialog.open)
    registerBoardDialog.showModal();
  return new Promise(function (resolve, reject) {
    let form = registerBoard.querySelector("form");
    let usernameInput = form.querySelector("#registerUsername");
    let registerTipDiv = registerBoard.querySelector("#registerTip");
    if (usernameInput.oninput == null) {
      usernameInput.oninput = function () {
        clearTipDivMsg(registerTipDiv);
      };
    }
    form.onsubmit = function () {
      registerSubmit(this, resolve);
    };
    let cancelButton = form.querySelector("#cancelRegisterButton");
    if (cancelButton.onclick == null) {
      cancelButton.onclick = function () {
        registerBoardDialog.close();
      };
    }
  });
}

function openLoginPromise(tip) {
  loginBoard.style.display = "block";
  if (loginBoardDialog == null)
    loginBoardDialog = AssistTool.showMessageDialog(loginBoard);
  if (!loginBoardDialog.open)
    loginBoardDialog.showModal();
  if (tip != null) {
    showTipDivMsg(loginResultTip, tip);
  }
  return new Promise(function (resolve, reject) {
    let form = loginBoard.querySelector("form");
    let usernameInput = form.querySelector("#username");
    if (usernameInput.oninput == null) {
      usernameInput.oninput = function () {
        clearTipDivMsg(loginResultTip);
      };
    }
    form.onsubmit = function () {
      loginSubmit(this, resolve);
    };
  });
}

function showTipDivMsg(tipDiv, msg) {
  tipDiv.style.display = "block";
  tipDiv.querySelector(".errorMsg").textContent = msg;
}

function clearTipDivMsg(tipDiv) {
  tipDiv.style.display = "none";
  tipDiv.querySelector(".errorMsg").textContent = "";
}

function openCaptchaPromise(contentObj, tip) {
  let captchaBoard = document.getElementById("captchaBoard");
  captchaBoard.style.display = "block";
  if (captchaDialog == null) {
    captchaDialog = AssistTool.showMessageDialog(captchaBoard);
  }
  if (!captchaDialog.open) {
    captchaDialog.showModal();
  }
  let captchaTipDiv = captchaBoard.querySelector("#captchaTip");
  if (tip != null) {
    showTipDivMsg(captchaTipDiv, tip);
  }
  let captchaPromise = new Promise(function (resolve, reject) {
    let url = loginSubmitContextPath + "auth/captcha-image";
    return fetch(url, {
      headers: new Headers({
        'Content-Type': 'application/json',
      })
    }).then(AssistTool.checkRespOkToJson).then(function (resultObj) {
      resultObj = AssistTool.regulateRestResult(resultObj);
      if (!resultObj.success) {
        showTipDivMsg(captchaTipDiv, resultObj.message);
        return;
      }

      let data = resultObj.data;
      let captchaImageUrl = data.bgImage;
      let captchaImage = captchaBoard.querySelector("#captchaImage");
      captchaImage.src = captchaImageUrl;
      let croppedImageUrl = data.croppedImage;
      let croppedImage = captchaBoard.querySelector("#croppedImage");
      croppedImage.src = croppedImageUrl;
      let offSetY = data.offSetY;
      croppedImage.style.top = offSetY + "px";
      croppedImage.style.left = "0";
      let croppedImageInput = captchaBoard.querySelector("#croppedImageInput");
      croppedImageInput.value = "0";
      croppedImageInput.oninput = function () {
        croppedImage.style.left = this.value + "px";
      };
      let captchaSubmitButton = captchaBoard.querySelector("#captchaSubmitButton");
      captchaSubmitButton.onclick = function () {
        contentObj.captchaId = data.captchaId;
        contentObj.captchaCode = parseInt(croppedImageInput.value);
        captchaDialog.close();
        croppedImage.style.top = "0";
        croppedImage.style.left = "0";
        clearTipDivMsg(captchaTipDiv);
        resolve(contentObj);
      }
    })
  });
  return captchaPromise;
}

function loginSubmitFetch(contentObj) {
  let url = loginSubmitContextPath + "auth/login";
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(contentObj),
    headers: new Headers({
      'Content-Type': 'application/json',
    })
  });
}

function loginSubmit(form, resolve) {
  let formData = new FormData(form);
  let username = formData.get("username").trim();
  if (username == "") {
    showTipDivMsg(loginResultTip, "请输入用户名");
    return;
  }
  let password = formData.get("password");
  if (password == "") {
    showTipDivMsg(loginResultTip, "请输入密码");
    return;
  }
  let contentObj = {
    username,
    password,
  };
  let invokeBeforeFn = function (tip) {
    let invokeBefore;
    if (requireCaptchaMap[username]) {
      invokeBefore = openCaptchaPromise(contentObj, tip).then(loginSubmitFetch).then(AssistTool.checkRespOkToJson);
    } else {
      invokeBefore = loginSubmitFetch(contentObj).then(AssistTool.checkRespOkToJson);
    }
    return invokeBefore;
  };
  let invokeAfter = function (resultObj) {
    resultObj = AssistTool.regulateRestResult(resultObj);
    if (!resultObj.success) {
      showTipDivMsg(loginResultTip, resultObj.message);
      return;
    }
    let tokenStr = resultObj.data;
    saveTokenStr(tokenStr);
    loginBoardDialog.close();
    resolve(true);
    showLoginedInfoBar();
  };

  fetchAndCheck(invokeBeforeFn, invokeAfter, username);
}

function showLoginedInfoBar(userInfo) {
  if (userInfo != null) {
    let nicknameSpan = loginedInfoBar.querySelector(".nickname");
    nicknameSpan.textContent = userInfo.nickname;
    loginedInfoBar.style.display = "block";
    needLoginInfoBar.style.display = "none";
  } else {
    let invokeBefore = function () {
      let url = loginSubmitContextPath + "auth/self-info";
      return fetch(url, {
        method: 'GET',
        headers: new Headers({
          'Content-Type': 'application/json',
          'manage-token': getTokenStr(),
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
      saveUserInfo(userInfo);
      let nicknameSpan = loginedInfoBar.querySelector(".nickname");
      nicknameSpan.textContent = userInfo.nickname;
      loginedInfoBar.style.display = "block";
      needLoginInfoBar.style.display = "none";
    };
    fetchAndCheck(invokeBefore, invokeAfter);
  }
}

function registerSubmitFetch(contentObj) {
  let url = loginSubmitContextPath + "auth/register";
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(contentObj),
    headers: new Headers({
      'Content-Type': 'application/json',
    })
  });
}

function registerSubmit(form, resolve) {
  let formData = new FormData(form);
  let registerTipDiv = form.querySelector("#registerTip");
  let username = formData.get("username").trim();
  if (username == "") {
    showTipDivMsg(registerTipDiv, "请输入用户名");
    return;
  }
  let password = formData.get("password");
  if (password == "") {
    showTipDivMsg(registerTipDiv, "请输入密码");
    return;
  }
  let passwordConfirm = formData.get("passwordConfirm");
  if (password != passwordConfirm) {
    showTipDivMsg(registerTipDiv, "两次密码不一致");
    return;
  }
  let nickname = formData.get("nickname").trim();
  let phone = formData.get("phone").trim();
  let mail = formData.get("mail").trim();
  let contentObj = {
    username,
    password,
    nickname,
    phone,
    mail,
  };
  let submitButtons = form.querySelectorAll("[type='submit']");
  let invokeBeforeFn = function (tip) {
    submitButtons.forEach(a => a.disabled = true);
    return registerSubmitFetch(contentObj).then(AssistTool.checkRespOkToJson);
  };
  let invokeAfter = function (resultObj) {
    submitButtons.forEach(a => a.disabled = false);
    resultObj = AssistTool.regulateRestResult(resultObj);
    if (!resultObj.success) {
      showTipDivMsg(registerTipDiv, resultObj.message);
      return;
    }

    registerBoardDialog.close();
    resolve(username);
  };
  invokeBeforeFn().then(invokeAfter).catch(function (err) {
    submitButtons.forEach(a => a.disabled = false);
    console.error(err);
  });
}

function logout() {
  let url = loginSubmitContextPath + "auth/logout";
  fetch(url, {
    method: 'GET',
    headers: new Headers({
      'Content-Type': 'application/json',
      'manage-token': getTokenStr(),
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
  clearTokenStr();
  clearUserInfo();
}

export function fetchAndCheck(invokeBeforeFn, invokeAfter, data) {
  return invokeBeforeFn().then(resultObj => checkResultCode(resultObj, invokeBeforeFn, data)).then(invokeAfter);
}

export function checkResultCode(resultObj, invokeBeforeFn, data) {
  if (resultObj.code == 401) {
    clearLoginStorge();
    return openLoginPromise("当前登录已失效，请重新登录").then(function (loginSuccess) {
      if (loginSuccess) {
        return invokeBeforeFn().then(resultObj => checkResultCode(resultObj, invokeBeforeFn, data));
      }
    });
  } else if (resultObj.code == 10001) {
    let enabled = enableRequireCaptchaWindow(data);
    if (!enabled)
      return Promise.reject("开启验证码校验失败");
    return invokeBeforeFn().then(resultObj => checkResultCode(resultObj, invokeBeforeFn, data));
  } else if (resultObj.code == 10002) {
    let enabled = enableRequireCaptchaWindow(data);
    if (!enabled)
      return Promise.reject("开启验证码校验失败");
    return invokeBeforeFn("验证码校验失败，请重新操作").then(resultObj => checkResultCode(resultObj, invokeBeforeFn, data));
  } else {
    return resultObj;
  }
}

function enableRequireCaptchaWindow(username) {
  if (username == null || username.toString().trim() == "") {
    return false;
  }
  requireCaptchaMap[username] = true;
  if (requireCaptchaTimeoutIdMap[username] != null)
    clearTimeout(requireCaptchaTimeoutIdMap[username]);
  // 2小时后取消验证码
  setTimeout(function () {
    requireCaptchaMap[username] = false;
  }, 1000 * 60 * 60 * 2);
  return true;
}


export function init(afterLogin, requireStartLogin, loginBarElement) {
  loginBoard = document.getElementById("loginBoard");
  loginResultTip = loginBoard.querySelector(".loginResultTip");
  if (typeof loginBarElement == "string") {
    loginBarElement = document.getElementById(loginBarElement);
  }
  needLoginInfoBar = document.getElementById("needLoginInfoBar");
  needLoginInfoBar.style.display = "inline";
  loginBarElement.appendChild(needLoginInfoBar);
  let loginAnchor = needLoginInfoBar.querySelector(".loginAnchor");
  loginAnchor.onclick = function () {
    openLoginPromise().then(afterLogin);
  };
  loginedInfoBar = document.getElementById("loginedInfoBar");
  loginBarElement.appendChild(loginedInfoBar);
  let logoutAnchor = loginedInfoBar.querySelector(".logoutAnchor");
  logoutAnchor.onclick = logout;

  if (requireStartLogin)
    checkLogin().then(afterLogin);

  registerBoard = document.getElementById("registerBoard");
  let registerAnchor = loginBoard.querySelector("#registerAnchor");
  registerAnchor.onclick = function () {
    openRegisterPromise().then(function (username) {
      showTipDivMsg(loginResultTip, "注册成功");
      let usernameInputOfLogin = loginBoard.querySelector("#username");
      usernameInputOfLogin.value = username;
      let passwordInputOfLogin = loginBoard.querySelector("#password");
      passwordInputOfLogin.value = "";
    });
  };
}
