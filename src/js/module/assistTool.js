/**
 * 辅助工具类 by Antield
 * https://antield.cnblogs.com/
 *
 * @type {Javascript}
 */

import dialogPolyfill from 'dialog-polyfill';

/**
 * Object.fromEntries folyfill
 */
if (typeof Object.fromEntries != "function") {
  Object.fromEntries = function (iterable) {
    var entries = ('entries' in iterable ? iterable.entries() : iterable);
    var object = {};
    var entry;
    while ((entry = entries.next()) && !entry.done) {
      var pair = entry.value;
      Object.defineProperty(object, pair[1][0], {
        configurable: true,
        enumerable: true,
        writable: true,
        value: pair[1][1]
      });
    }
    return object;
  };
}

/**
 * 对数组元素进行分组
 * @param  {Array}   array 需分组的数组
 * @param  {Function} fn    分组依据函数
 * @return {Array}         分组结果
 */
export function groupBy(array, fn) {
  let groups = {};
  array.forEach(function (o) {
    let group = fn(o);
    groups[group] = groups[group] || [];
    groups[group].push(o);
  });
  return Object.keys(groups).map(function (group) {
    return {
      key: group,
      list: groups[group]
    };
  });
}

/**
 * 对值或内容进行HTML编码
 * @param  {string} content             需要编码的值或内容
 * @param  {boolean} replaceBreakLine 是否替换换行符为<br/>（可不传）
 * @return {string}                  转换过的html
 */
export function encodeValueHtml(content, replaceBreakLine) {
  let html = content.replace(/\&/gm, "&amp;"); //&#38;
  html = html.replace(/\"/gm, "&quot;"); //&#34;
  html = html.replace(/\'/gm, "&apos;"); //&#39;
  html = html.replace(/\</gm, "&lt;"); //&#60;
  html = html.replace(/\>/gm, "&gt;"); //&#62;
  if (replaceBreakLine === true)
    html = html.replace(/\r?\n/gm, "<br/>"); //&#62;
  return html;
}

function getTemplatePieceRegex() {
  let regex1 = "(\\{\\+?[_a-zA-Z]\\w{1,254}?(?:\\?\\?.+)?\\})";
  let regex2 = "(\\{[_a-zA-Z]\\w{1,254}?\\?[\\S]{1,254}?\\:[\\S]{0,254}?\\})";
  let regex3 = "(\\{[_a-zA-Z]\\w{1,254}?:display-\\w[\\w-]{0,64}?\\w\\})";
  let regex4 = "(\\[[_a-zA-Z][\\w-:]{1,254}\\]=\"\\{\\?[_a-zA-Z]\\w{1,254}?}[^\"]*?\")";
  let regex5 = "(<!--\\{\\+\\+[_a-zA-Z]\\w{1,254}?(?:\\?\\?.+)?\\}-->)";
  let regexStr = regex1 + "|" + regex2 + "|" + regex3 + "|" + regex4 + "|" + regex5;
  let regex = new RegExp(regexStr, "g");
  return regex;
}
const templatePieceRegex = getTemplatePieceRegex();

/**
 * 将指定的模板HTML用指定的对象属性替换
 * 目前支持5种格式替换：
 *  1. {+fieldName??defaultValue} 替换为 fieldValue，加号“+”和双问号后部分“??defaultValue”是可选项，
 *     当存在“+”，fieldValue原样替换，不进行HTML编码，defaultValue作为当fieldValue为undefined或null时的替代项
 *  2. {booleanField?content1:content2} 当booleanField为真，替换为content1，否则为content2
 *  3. {booleanField:display-displayValue} 当booleanField为false，替换为"display:none;"，
 *     undefined和null视为true，值为true替换为"display:displayValue;"
 *  4. [property]="{?booleanField}propertyValue" 当booleanField为true，输出该属性，
 *     为false则不输出，属性值可不设，不设时省略，undefined和null视为false
 *  5. <!--{++fieldName??defaultValue}--> 替换为 fieldValue，双问号后部分“??defaultValue”是可选项，
 *     该格式下fieldValue原样替换，不进行HTML编码，defaultValue作为当fieldValue为undefined或null或空字符串时的替代项，
 *     此规则常置于tbody等标签下，tbody标签不允许直接出现文本，若出现，文本会被移置到table标签之前
 *
 * @param  {string} template 模板HTML
 * @param  {object} obj      用来替换的对象
 * @return {string}          生成的HTML
 */
export function replaceTemplateWithObject(template, obj) {
  return template.replace(templatePieceRegex, function (match, p1, p2, p3, p4, p5) {
    if (p1) {
      let matchedText = p1;
      let isHtmlContent = matchedText.indexOf("+") === 1;
      let textPartEnd = matchedText.length - 1;
      let keyPosStart = isHtmlContent ? 2 : 1;
      let defaultValuePartPos = matchedText.indexOf("??");
      let keyPosEnd = defaultValuePartPos < 0 ? textPartEnd : defaultValuePartPos;
      let key = matchedText.substring(keyPosStart, keyPosEnd);
      let pValue = obj[key];
      let pValueNotExist = pValue == undefined;
      let html;
      if (pValueNotExist) {
        if (defaultValuePartPos < 0) {
          html = "";
        } else {
          let defaultValueStr = matchedText.substring(defaultValuePartPos + 2, textPartEnd);
          if (isHtmlContent)
            html = defaultValueStr;
          else
            html = encodeValueHtml(defaultValueStr);
        }
      } else {
        if (isHtmlContent)
          html = pValue;
        else
          html = encodeValueHtml(pValue.toString());
      }
      return html;
    }
    if (p2) {
      let matchedText = p2;
      let key = matchedText.substring(1, matchedText.indexOf("?"));
      let pValue = obj[key];
      let ifTrueValue = matchedText.substring(matchedText.indexOf("?") + 1, matchedText.indexOf(":"));
      let ifFalseValue = matchedText.substring(matchedText.indexOf(":") + 1, matchedText.length - 1);
      let replaceStr = pValue == true ? ifTrueValue : ifFalseValue;
      return replaceStr;
    }
    if (p3) {
      let matchedText = p3;
      let fieldBoundaryPos = matchedText.indexOf(":");
      let key = matchedText.substring(1, fieldBoundaryPos);
      let pValue = obj[key];
      let pValueFalse = pValue == false;
      let html;
      if (pValueFalse) {
        html = "display:none;"
      } else {
        let displayValuePos = matchedText.indexOf("-", fieldBoundaryPos) + 1;
        let displayValue = matchedText.substring(displayValuePos, matchedText.length - 1);
        html = "display:" + displayValue + ";";
      }
      return html;
    }
    if (p4) {
      let matchedText = p4;
      let leftBracketPos = matchedText.indexOf("{");
      let rightBracketPos = matchedText.indexOf("}");
      let key = matchedText.substring(leftBracketPos + 2, rightBracketPos);
      let pValue = obj[key];
      let pValueTrue = pValue == true;
      if (!pValueTrue) {
        return "";
      } else {
        let leftBracketAttrPos = matchedText.indexOf("[");
        let rightBracketAttrPos = matchedText.indexOf("]");
        let attr = matchedText.substring(leftBracketAttrPos + 1, rightBracketAttrPos);
        let leftBracketValuePos = matchedText.indexOf("}");
        let rightBracketValuePos = matchedText.lastIndexOf("\"");
        let value = matchedText.substring(leftBracketValuePos + 1, rightBracketValuePos);
        if (value == "") {
          return attr;
        } else {
          return attr + "=\"" + value + "\"";
        }
      }
    }
    if (p5) {
      let matchedText = p5;
      let textPartEnd = matchedText.length - 4;
      let keyPosStart = 7;
      let defaultValuePartPos = matchedText.indexOf("??");
      let keyPosEnd = defaultValuePartPos < 0 ? textPartEnd : defaultValuePartPos;
      let key = matchedText.substring(keyPosStart, keyPosEnd);
      let pValue = obj[key];
      let pValueNotExist = pValue == undefined || pValue == "";
      let html;
      if (pValueNotExist) {
        if (defaultValuePartPos < 0)
          html = "";
        else
          html = matchedText.substring(defaultValuePartPos + 2, textPartEnd);
      } else {
        html = pValue;
      }
      return html;
    }
  });
}

/**
 * 显示页面消息提示
 * @param  {string|HTMLElement} messageHtml 需要显示的消息的HTML或节点对象
 * @return {HTMLDialogElement}             对话框对象
 */
export function showMessageTip(messageHtml) {
  messageHtml = "<span class=\"material-icons\" style=\"color:blue;margin-right:1em;vertical-align:middle;\">info</span>" + messageHtml;
  let dialog = showMessageDialog(messageHtml, true, true);
  dialog.blur();
  return dialog;
}

/**
 * 显示页面消息对话框
 * @param  {string|HTMLElement} messageHtml 需要显示的消息的HTML或节点对象
 * @param  {boolean} forAMoment  消息框是否在一段时间后关闭
 * @param  {boolean} noModal     不显示幕布背景
 * @return {HTMLDialogElement}             对话框对象
 */
export function showMessageDialog(messageHtml, forAMoment, noModal) {
  let dialog = document.createElement("dialog");
  let needPloyFill = typeof HTMLDialogElement === "undefined";
  if (needPloyFill) {
    dialogPolyfill.registerDialog(dialog);
  }

  if (typeof messageHtml === "string") {
    dialog.innerHTML = messageHtml;
  } else if (messageHtml instanceof HTMLElement) {
    dialog.appendChild(messageHtml);
  }
  document.body.appendChild(dialog);
  dialog.style.boxShadow = '0px 0px 2px 2px #d5d5d5';
  dialog.style.borderRadius = '10px';
  dialog.style.borderWidth = '1px';
  dialog.style.borderColor = '#acacac';
  if (noModal) {
    if (needPloyFill) {
      dialog.style.position = "fixed";
      dialog.style.top = "50%";
      dialog.style.transform = "translate(0, -50%)";
    } else {
      dialog.style.top = "0";
      dialog.style.bottom = "0";
    }

    dialog.show();
  } else {
    dialog.showModal();
    if (needPloyFill) {
      let backdrop = dialog.nextElementSibling;
      backdrop.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
      backdrop.style.position = "fixed";
      backdrop.style.top = "0";
      backdrop.style.width = "100%";
      backdrop.style.height = "100%";
    }
  }

  if (forAMoment) {
    setTimeout(function () {
      //dialog.close();
      dialog.parentNode.removeChild(dialog);
    }, 5000);
  }

  return dialog;
};

/**
 * 显示页面消息确认框
 * @param  {string} message 确认提示消息
 * @return {Promise}         确认结果Promise
 */
export function confirmDialog(message) {
  return new Promise(function (resolve, reject) {
    let infoDiv = document.createElement("div");
    let iconSpan = document.createElement("span");
    iconSpan.textContent = "提示：";
    let msgSpan = document.createElement("span");
    msgSpan.innerHTML = encodeValueHtml(message, true);
    infoDiv.appendChild(iconSpan);
    infoDiv.appendChild(msgSpan);
    let submitRowDiv = document.createElement("div");
    submitRowDiv.className = "submitRowDiv";
    submitRowDiv.style.textAlign = "right";
    submitRowDiv.style.marginTop = "1em";
    let submitButton = document.createElement("input");
    submitButton.type = "submit";
    submitButton.value = "确定";
    submitButton.className = "plainButton";
    let cancelButton = document.createElement("input");
    cancelButton.type = "button";
    cancelButton.value = "取消";
    cancelButton.className = "plainButton";
    cancelButton.style.marginLeft = "1em";
    submitRowDiv.appendChild(submitButton);
    submitRowDiv.appendChild(cancelButton);
    let boxDiv = document.createElement("div");
    boxDiv.appendChild(infoDiv);
    boxDiv.appendChild(submitRowDiv);
    let dialog = showMessageDialog(boxDiv);
    submitButton.onclick = function () {
      dialog.parentNode.removeChild(dialog);
      resolve(true);
    };
    cancelButton.onclick = function () {
      dialog.parentNode.removeChild(dialog);
      resolve(false);
    };
  });
}

/**
 * 格式化日期为典型格式字符串，如："2019-12-21 11:09"
 * @param  {Date} date                      日期时间
 * @param  {boolean} withOutTime               是否舍去时间
 * @param  {boolean} withJunctor               是否用字符“T”连接日期时间
 * @param  {boolean} withSeconds               是否显示秒数
 * @return {string}             格式化字符串
 */
export function formatDateTimeToTypicalString(date, withOutTime, withJunctor, withSeconds) {
  let month = (date.getMonth() + 1).toString();
  let day = date.getDate().toString();
  let year = date.getFullYear().toString();

  if (month.length < 2)
    month = '0' + month;
  if (day.length < 2)
    day = '0' + day;
  let dateStr = [year, month, day].join('-');

  if (withOutTime == true) {
    return dateStr;
  }

  let hour = date.getHours().toString();
  let minute = date.getMinutes().toString();
  if (hour.length < 2)
    hour = '0' + hour;
  if (minute.length < 2)
    minute = '0' + minute;
  let timeStr = hour + ":" + minute;
  if (withSeconds == true) {
    let seconds = date.getSeconds().toString();
    if (seconds.length < 2)
      seconds = "0" + seconds;
    timeStr += ":" + seconds;
  }

  let junctor = withJunctor ? "T" : " ";
  let datetimeStr = dateStr + junctor + timeStr;
  return datetimeStr;
};

/**
 * 为日期字符串添加时区信息
 * @param  {number} timezoneOffset         时区偏差（time-zone offset）表示协调世界时（UTC）与本地时区之间的差值，单位为分钟。可不传，此时取本地时区偏移量
 * @param  {boolean} alreadyHasSeconds      原字符串已包含秒钟内容
 * @param  {boolean} alreadyHasMilliseconds 原字符串已包含毫秒内容
 * @return {string}                        需追加的时区信息字符串
 */
export function getTimezoneAppendStr(timezoneOffset, alreadyHasSeconds, alreadyHasMilliseconds) {
  if (timezoneOffset == undefined)
    timezoneOffset = new Date().getTimezoneOffset();
  let offsetAppendStr = ":00.000";
  if (alreadyHasSeconds === true)
    offsetAppendStr = ".000";
  if (alreadyHasMilliseconds === true)
    offsetAppendStr = "";

  if (timezoneOffset == 0) {
    return offsetAppendStr + "Z";
  } else {
    let positive = timezoneOffset <= 0;
    let offsetMinutes = Math.abs(timezoneOffset);
    let offsetHours = Math.floor(offsetMinutes / 60);
    let remainMinutes = offsetMinutes % 60;
    let hoursStr = offsetHours < 10 ? "0" + offsetHours.toString() : offsetHours.toString();
    let minutesStr = remainMinutes < 10 ? "0" + remainMinutes.toString() : remainMinutes.toString();
    return offsetAppendStr + (positive ? "+" : "-") + hoursStr + ":" + minutesStr;
  }
};

/**
 * 格式化日期为带时区信息的标准格式字符串，如："2019-12-21T11:09.000+08:00"
 * @param  {Date} date 日期时间
 * @return {string}      格式化的字符串
 */
export function formatDateTimeStringWithTimeZone(date) {
  let typicalStr = formatDateTimeToTypicalString(date, false, true, true);
  let millisecondes = date.getMilliseconds();
  let millisecondesStr = millisecondes.toString();
  if (millisecondes < 10) {
    millisecondesStr = "00" + millisecondesStr;
  } else if (millisecondes < 100) {
    millisecondesStr = "0" + millisecondesStr;
  }
  let timeZoneAppendStr = getTimezoneAppendStr(date.getTimezoneOffset(), true, true);
  let fullStr = typicalStr + "." + millisecondesStr + timeZoneAppendStr;
  return fullStr;
}

/**
 * 用于fetch的响应结果判断
 * @param  {object} response Response对象
 * @return {Promise}          返回JSON对象
 */
export function checkRespOkToJson(response) {
  let contentType = response.headers.get("Content-Type");
  let isJson = contentType != null && contentType.startsWith("application/json");
  if (isJson) {
    return response.json();
  } else {
    if (!response.ok)
      console.error("not response ok, status:" + response.status + ", statusText:" + response.statusText);
    return response.text().then(function (text) {
      try {
        let obj = JSON.parse(text);
        return obj;
      } catch (ex) {
        throw new Error("response error: text: " + text);
      }
    });
  }
};

/**
 * 格式化结果对象
 * @param  {object} resultObj               结果对象
 * @return {object}           结果
 */
export function regulateRestResult(resultObj) {
  if (resultObj.success || resultObj.code == 0) {
    return Object.assign(resultObj, {
      success: true,
      code: 0,
      message: resultObj.message || resultObj.msg,
    });
  } else {
    if (resultObj.success == undefined && resultObj.code == undefined) {
      return {
        success: false,
        code: resultObj.status,
        message: resultObj.error + ", message: " + resultObj.message,
        data: resultObj.timestamp
      };
    } else {
      return Object.assign(resultObj, {
        success: false,
        code: resultObj.code || 500,
        message: resultObj.message || resultObj.msg,
      });
    }
  }
}
