import '@material/web/switch/switch.js';
import * as AssistTool from "../module/assistTool.js";
import * as PageSwitcher from "../part/pageSwitcher.js";
import * as LoginModule from "../part/login.js";

let rootGroupSubsContainer = document.getElementById("categoryTreeBody");
let groupTreeNodeTemplate = document.getElementById("groupTreeNodeItem").innerHTML;
let simplexTreeNodeTemplate = document.getElementById("simplexTreeNodeItem").innerHTML;
let categoryDetailTemplate = document.getElementById("categoryDetailTemplate").innerHTML;
let categoryDetailContainer = document.getElementById("contentDetailMain");
let categoryEditTemplate = document.getElementById("editCategoryFormTemplate").innerHTML;
let categoryEditContainer = document.getElementById("contentEditMain");
let categoryAddTemplate = document.getElementById("addCategoryFormTemplate").innerHTML;
let categoryAddContainer = document.getElementById("contentAddMain");
let portalSelect = document.getElementById("portalSelect");

let groupTreeNodePickupTemplate = document.getElementById("groupTreeNodePickupItem").innerHTML;
let categoryNodePickupBoard = document.getElementById("categoryNodePickupBoard");

let categoryArrayCache = null;
let categoryTreeCache = null;
let syncTypes = null;
let queryProtocols = null;
let queryMethods = null;
let portals = null;

function getTokenStr() {
  return LoginModule.getTokenStr();
}

function uploadImage(formData, imgElement, inputHidden) {
  let url = poiManageApiUrl + "sys/file/upload-image";
  let invokeBefore = function() {
    return fetch(url, {
      method: 'POST',
      headers: new Headers({
        'Authorization': getTokenStr(),
      }),
      body: formData,
    }).then(AssistTool.checkRespOkToJson);
  };
  let invokeAfter = function(resultObj) {
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

window.addCategory = function(parentId) {
  categoryAddContainer.innerHTML = categoryAddTemplate;
  let parentIdInput = categoryAddContainer.querySelector("input[name='parentId']");
  let nameInputElement = categoryAddContainer.querySelector("input[id='parentIdText']");
  parentIdInput.setAttribute("value", parentId);
  if (parentId == null) {
    nameInputElement.setAttribute("value", "");
  } else if (parentId == 0) {
    nameInputElement.setAttribute("value", "[根类别](0)");
  } else {
    let parentCategory = categoryArrayCache.find(c => c.id == parentId);
    if (parentCategory != null)
      nameInputElement.setAttribute("value", parentCategory.name + "(" + parentId + ")");
  }

  let showParentIdPickupButton = categoryAddContainer.querySelector(".showParentIdPickup");
  showParentIdPickupButton.onclick = function() {
    let parentId = parseInt(parentIdInput.value);
    if (isNaN(parentId))
      parentId = null;
    showCategoryNodePickupBoard(categoryTreeCache, parentIdInput, parentId, nameInputElement, null);
  };

  let syncTypeSelect = categoryAddContainer.querySelector("select[name='syncType']");
  if (syncTypeSelect != null && syncTypes != null) {
    for (let syncType of syncTypes) {
      let option = document.createElement("option");
      option.value = syncType.code;
      option.text = syncType.desc;
      syncTypeSelect.appendChild(option);
    }
  }

  let dataProtocolSelect = categoryAddContainer.querySelector("select[name='dataProtocol']");
  if (dataProtocolSelect != null && queryProtocols != null) {
    for (let protocol of queryProtocols) {
      let option = document.createElement("option");
      option.value = protocol.code;
      option.text = protocol.desc;
      dataProtocolSelect.appendChild(option);
    }
  }

  let dataMethodSelect = categoryAddContainer.querySelector("select[name='dataMethodId']");
  if (dataMethodSelect != null && queryMethods != null) {
    let dataMethods = queryMethods.filter(m => m.type == 1);
    for (let method of dataMethods) {
      let option = document.createElement("option");
      option.value = method.id;
      option.text = method.name;
      dataMethodSelect.appendChild(option);
    }
  }
  let addMethodSelect = categoryAddContainer.querySelector("select[name='addMethodId']");
  if (addMethodSelect != null && queryMethods != null) {
    let addMethods = queryMethods.filter(m => m.type == 2);
    for (let method of addMethods) {
      let option = document.createElement("option");
      option.value = method.id;
      option.text = method.name;
      addMethodSelect.appendChild(option);
    }
  }
  let updateMethodSelect = categoryAddContainer.querySelector("select[name='updateMethodId']");
  if (updateMethodSelect != null && queryMethods != null) {
    let updateMethods = queryMethods.filter(m => m.type == 3);
    for (let method of updateMethods) {
      let option = document.createElement("option");
      option.value = method.id;
      option.text = method.name;
      updateMethodSelect.appendChild(option);
    }
  }
  let deleteMethodSelect = categoryAddContainer.querySelector("select[name='deleteMethodId']");
  if (deleteMethodSelect != null && queryMethods != null) {
    let deleteMethods = queryMethods.filter(m => m.type == 4 || m.type == 5);
    for (let method of deleteMethods) {
      let option = document.createElement("option");
      option.value = method.id;
      option.text = method.name;
      deleteMethodSelect.appendChild(option);
    }
  }

  let imageUrlFile = categoryAddContainer.querySelector("#imageUrl_file");
  let imageUrlContainer = imageUrlFile.parentNode;
  let imageUrlImg = imageUrlContainer.querySelector("#imageUrl_img");
  let imageUrlHidden = imageUrlContainer.querySelector("input[name='imageUrl']");
  imageUrlFile.onchange = function() {
    let files = imageUrlFile.files;
    if (files.length < 1)
      return;

    let fd = new FormData();
    fd.append("file", files[0])
    uploadImage(fd, imageUrlImg, imageUrlHidden);
  };
  let imageUrlRemove = imageUrlContainer.querySelector("#imageUrl_remove");
  imageUrlRemove.onclick = function() {
    imageUrlFile.value = "";
    imageUrlHidden.value = "";
    imageUrlImg.src = "";
  };

  let markerIconFile = categoryAddContainer.querySelector("#markerIcon_file");
  let markerIconContainer = markerIconFile.parentNode;
  let markerIconImg = markerIconContainer.querySelector("#markerIcon_img");
  let markerIconHidden = markerIconContainer.querySelector("input[name='markerIcon']");
  markerIconFile.onchange = function() {
    let files = markerIconFile.files;
    if (files.length < 1)
      return;

    let fd = new FormData();
    fd.append("file", files[0])
    uploadImage(fd, markerIconImg, markerIconHidden);
  };
  let markerIconRemove = markerIconContainer.querySelector("#markerIcon_remove");
  markerIconRemove.onclick = function() {
    markerIconFile.value = "";
    markerIconHidden.value = "";
    markerIconImg.src = "";
  };

  let markerIconOfflineFile = categoryAddContainer.querySelector("#markerIconOffline_file");
  let markerIconOfflineContainer = markerIconOfflineFile.parentNode;
  let markerIconOfflineImg = markerIconOfflineContainer.querySelector("#markerIconOffline_img");
  let markerIconOfflineHidden = markerIconOfflineContainer.querySelector("input[name='markerIconOffline']");
  markerIconOfflineFile.onchange = function() {
    let files = markerIconOfflineFile.files;
    if (files.length < 1)
      return;

    let fd = new FormData();
    fd.append("file", files[0])
    uploadImage(fd, markerIconOfflineImg, markerIconOfflineHidden);
  };
  let markerIconOfflineRemove = markerIconOfflineContainer.querySelector("#markerIconOffline_remove");
  markerIconOfflineRemove.onclick = function() {
    markerIconOfflineFile.value = "";
    markerIconOfflineHidden.value = "";
    markerIconOfflineImg.src = "";
  };

  let form = categoryAddContainer.querySelector("form#addCategoryForm");
  form.onsubmit = function() {
    addCategorySubmit(this);
  };
  let cancleButton = categoryAddContainer.querySelector("input[type='button'][value='取消']");
  cancleButton.onclick = function() {
    categoryAddContainer.innerHTML = "请在左侧进行添加操作";
  };

  PageSwitcher.selectTabView("categoryAdd");
  return form;
};

function showCategoryNodePickupBoard(categoryTreeRoots, inputElement, currentId, nameInputElement, selfId) {
  let pickupBoardBody = categoryNodePickupBoard.querySelector(".pickupBoardBody");

  function closeBoard() {
    categoryNodePickupBoard.style.display = "none";
  }
  let closeBoardButton = categoryNodePickupBoard.querySelector(".closeBoardButton");
  closeBoardButton.onclick = closeBoard;
  let cancelBoardButton = categoryNodePickupBoard.querySelector("input[value='取消']");
  cancelBoardButton.onclick = closeBoard;

  let treeRoots = [{
    id: 0,
    title: "[根类别]",
    subGroups: categoryTreeRoots
  }];

  fillSubNodes(pickupBoardBody, treeRoots, null, 2, groupTreeNodePickupTemplate, null, currentId);

  let pickupNodeResultSpan = categoryNodePickupBoard.querySelector(".pickupNodeResult");
  let currentSelectedId = currentId;
  let lastSelectedNode = null;
  if (currentSelectedId != null) {
    lastSelectedNode = pickupBoardBody.querySelector("div[data-id='" + currentSelectedId + "']");
    pickupNodeResultSpan.textContent = currentSelectedId;
  }

  function changeSelected(div) {
    if (lastSelectedNode != null)
      lastSelectedNode.classList.remove("current");
    div.classList.add("current");
    currentSelectedId = parseInt(div.getAttribute("data-id"));
    pickupNodeResultSpan.textContent = currentSelectedId;
    lastSelectedNode = div;
  }

  let nodeLabels = pickupBoardBody.querySelectorAll(".nodeLabel");
  for (let nodeLabel of nodeLabels) {
    nodeLabel.onclick = function() {
      changeSelected(this);
    };
  }

  if (selfId != null) {
    let selfIdNode = pickupBoardBody.querySelector("div[data-id='" + selfId + "']");
    selfIdNode.classList.add("disabled");
    selfIdNode.onclick = null;
  }

  let submitBoardButton = categoryNodePickupBoard.querySelector("input[type='submit']");
  submitBoardButton.onclick = function() {
    if (currentSelectedId == null || currentSelectedId === "") {
      AssistTool.showMessageTip("请选择父类别");
      return;
    }

    inputElement.value = currentSelectedId;
    let title = lastSelectedNode.getAttribute("data-title");
    nameInputElement.value = title + "(" + currentSelectedId + ")";

    closeBoard();
  };
  categoryNodePickupBoard.style.display = "block";
  if (lastSelectedNode != null) {
    lastSelectedNode.scrollIntoView();
  }
};

window.editCategory = function(id) {
  let category = categoryArrayCache.find(c => c.id == id);

  let detailHtml = AssistTool.replaceTemplateWithObject(categoryEditTemplate, category);
  categoryEditContainer.innerHTML = detailHtml;

  let parentId = category.parentId;
  let parentIdInput = categoryEditContainer.querySelector("input[name='parentId']");
  let nameInputElement = categoryEditContainer.querySelector("input[id='parentIdText-" + id + "']");
  parentIdInput.setAttribute("value", parentId);
  if (parentId == null) {
    nameInputElement.setAttribute("value", "");
  } else if (parentId == 0) {
    nameInputElement.setAttribute("value", "[根类别](0)");
  } else {
    let parentCategory = categoryArrayCache.find(c => c.id == parentId);
    if (parentCategory != null)
      nameInputElement.setAttribute("value", parentCategory.name + "(" + parentId + ")");
  }

  let showParentIdPickupButton = categoryEditContainer.querySelector(".showParentIdPickup");
  showParentIdPickupButton.onclick = function() {
    let currentParentId = parseInt(parentIdInput.value);
    if (isNaN(currentParentId))
      currentParentId = null;
    showCategoryNodePickupBoard(categoryTreeCache, parentIdInput, currentParentId, nameInputElement, id);
  };

  let syncTypeSelect = categoryEditContainer.querySelector("select[name='syncType']");
  if (syncTypeSelect != null && syncTypes != null) {
    for (let syncType of syncTypes) {
      let option = document.createElement("option");
      option.value = syncType.code;
      option.text = syncType.desc;
      syncTypeSelect.appendChild(option);
    }
    if (category.syncType != null)
      syncTypeSelect.value = category.syncType;
  }

  let dataProtocolSelect = categoryEditContainer.querySelector("select[name='dataProtocol']");
  if (dataProtocolSelect != null && queryProtocols != null) {
    for (let protocol of queryProtocols) {
      let option = document.createElement("option");
      option.value = protocol.code;
      option.text = protocol.desc;
      dataProtocolSelect.appendChild(option);
    }
    if (category.dataProtocol != null)
      dataProtocolSelect.value = category.dataProtocol;
  }

  let dataMethodSelect = categoryEditContainer.querySelector("select[name='dataMethodId']");
  if (dataMethodSelect != null && queryMethods != null) {
    let dataMethods = queryMethods.filter(m => m.type == 1);
    for (let method of dataMethods) {
      let option = document.createElement("option");
      option.value = method.id;
      option.text = method.name;
      dataMethodSelect.appendChild(option);
    }
    if (category.dataMethodId != null)
      dataMethodSelect.value = category.dataMethodId;
  }
  let addMethodSelect = categoryEditContainer.querySelector("select[name='addMethodId']");
  if (addMethodSelect != null && queryMethods != null) {
    let addMethods = queryMethods.filter(m => m.type == 2);
    for (let method of addMethods) {
      let option = document.createElement("option");
      option.value = method.id;
      option.text = method.name;
      addMethodSelect.appendChild(option);
    }
    if (category.addMethodId != null)
      addMethodSelect.value = category.addMethodId;
  }
  let updateMethodSelect = categoryEditContainer.querySelector("select[name='updateMethodId']");
  if (updateMethodSelect != null && queryMethods != null) {
    let updateMethods = queryMethods.filter(m => m.type == 3);
    for (let method of updateMethods) {
      let option = document.createElement("option");
      option.value = method.id;
      option.text = method.name;
      updateMethodSelect.appendChild(option);
    }
    if (category.updateMethodId != null)
      updateMethodSelect.value = category.updateMethodId;
  }
  let deleteMethodSelect = categoryEditContainer.querySelector("select[name='deleteMethodId']");
  if (deleteMethodSelect != null && queryMethods != null) {
    let deleteMethods = queryMethods.filter(m => m.type == 4 || m.type == 5);
    for (let method of deleteMethods) {
      let option = document.createElement("option");
      option.value = method.id;
      option.text = method.name;
      deleteMethodSelect.appendChild(option);
    }
    if (category.deleteMethodId != null)
      deleteMethodSelect.value = category.deleteMethodId;
  }

  let imageUrlFile = categoryEditContainer.querySelector("#imageUrl_file_" + id);
  let imageUrlContainer = imageUrlFile.parentNode;
  let imageUrlImg = imageUrlContainer.querySelector("#imageUrl_img_" + id);
  let imageUrlHidden = imageUrlContainer.querySelector("input[name='imageUrl']");
  imageUrlFile.onchange = function() {
    let files = imageUrlFile.files;
    if (files.length < 1)
      return;

    let fd = new FormData();
    fd.append("file", files[0])
    uploadImage(fd, imageUrlImg, imageUrlHidden);
  };
  let imageUrlRemove = imageUrlContainer.querySelector("#imageUrl_remove_" + id);
  imageUrlRemove.onclick = function() {
    imageUrlFile.value = "";
    imageUrlHidden.value = "";
    imageUrlImg.src = "";
  };

  let markerIconFile = categoryEditContainer.querySelector("#markerIcon_file_" + id);
  let markerIconContainer = markerIconFile.parentNode;
  let markerIconImg = markerIconContainer.querySelector("#markerIcon_img_" + id);
  let markerIconHidden = markerIconContainer.querySelector("input[name='markerIcon']");
  markerIconFile.onchange = function() {
    let files = markerIconFile.files;
    if (files.length < 1)
      return;

    let fd = new FormData();
    fd.append("file", files[0])
    uploadImage(fd, markerIconImg, markerIconHidden);
  };
  let markerIconRemove = markerIconContainer.querySelector("#markerIcon_remove_" + id);
  markerIconRemove.onclick = function() {
    markerIconFile.value = "";
    markerIconHidden.value = "";
    markerIconImg.src = "";
  };

  let markerIconOfflineFile = categoryEditContainer.querySelector("#markerIconOffline_file_" + id);
  let markerIconOfflineContainer = markerIconOfflineFile.parentNode;
  let markerIconOfflineImg = markerIconOfflineContainer.querySelector("#markerIconOffline_img_" + id);
  let markerIconOfflineHidden = markerIconOfflineContainer.querySelector("input[name='markerIconOffline']");
  markerIconOfflineFile.onchange = function() {
    let files = markerIconOfflineFile.files;
    if (files.length < 1)
      return;

    let fd = new FormData();
    fd.append("file", files[0])
    uploadImage(fd, markerIconOfflineImg, markerIconOfflineHidden);
  };
  let markerIconOfflineRemove = markerIconOfflineContainer.querySelector("#markerIconOffline_remove_" + id);
  markerIconOfflineRemove.onclick = function() {
    markerIconOfflineFile.value = "";
    markerIconOfflineHidden.value = "";
    markerIconOfflineImg.src = "";
  };

  let form = categoryEditContainer.querySelector("form#editCategoryForm");
  form.onsubmit = function() {
    editCategorySubmit(this);
  };
  let cancleButton = categoryEditContainer.querySelector("input[type='button'][value='取消']");
  cancleButton.onclick = function() {
    categoryEditContainer.innerHTML = "请在左侧树中选择节点进行编辑";
  };

  PageSwitcher.selectTabView("categoryEdit");
  categoryEditContainer.firstElementChild.scrollIntoView();
}

window.showCategory = function(id) {
  let category = categoryArrayCache.find(c => c.id == id);
  let categoryVo = Object.assign({}, category);

  let parentId = categoryVo.parentId;
  if (parentId != null) {
    if (parentId == 0) {
      categoryVo.parentDesc = "[根类别]" + "(" + parentId + ")";
    } else {
      let parent = categoryArrayCache.find(c => c.id == parentId);
      if (parent != null) {
        categoryVo.parentDesc = parent.name + "(" + parentId + ")";
      }
    }
  }

  let dataMethodId = categoryVo.dataMethodId;
  if (dataMethodId != null) {
    let dataMethod = queryMethods.find(m => m.id == dataMethodId);
    if (dataMethod != null) {
      categoryVo.dataMethodDesc = dataMethod.name + "(" + dataMethodId + ")";
    }
  }
  let addMethodId = categoryVo.addMethodId;
  if (addMethodId != null) {
    let addMethod = queryMethods.find(m => m.id == addMethodId);
    if (addMethod != null) {
      categoryVo.addMethodDesc = addMethod.name + "(" + addMethodId + ")";
    }
  }
  let updateMethodId = categoryVo.updateMethodId;
  if (updateMethodId != null) {
    let updateMethod = queryMethods.find(m => m.id == updateMethodId);
    if (updateMethod != null) {
      categoryVo.updateMethodDesc = updateMethod.name + "(" + updateMethodId + ")";
    }
  }
  let deleteMethodId = categoryVo.deleteMethodId;
  if (deleteMethodId != null) {
    let deleteMethod = queryMethods.find(m => m.id == deleteMethodId);
    if (deleteMethod != null) {
      categoryVo.deleteMethodDesc = deleteMethod.name + "(" + deleteMethodId + ")";
    }
  }

  let detailHtml = AssistTool.replaceTemplateWithObject(categoryDetailTemplate, categoryVo);
  categoryDetailContainer.innerHTML = detailHtml;

  PageSwitcher.selectTabView("categoryView");
  categoryDetailContainer.firstElementChild.scrollIntoView();
}

function storeCategoriesCache(categories, treeGroups) {
  categoryTreeCache = treeGroups;
  categoryArrayCache = [];
  storeCategoryArray(categories, categoryArrayCache);

  function storeCategoryArray(categories, cacheArr) {
    for (let category of categories) {
      let categoryVo = Object.assign({}, category);
      cacheArr.push(categoryVo);
      let subCategories = categoryVo.children;
      delete categoryVo.children;
      let imageUrl = categoryVo.imageUrl;
      categoryVo.imageUrlFull = imageUrl == null || imageUrl.trim() == "" ? null : poiManageApiUrl + imageUrl.trim();
      let markerIcon = categoryVo.markerIcon;
      categoryVo.markerIconFull = markerIcon == null || markerIcon.trim() == "" ? null : poiManageApiUrl + markerIcon.trim();
      let markerIconOffline = categoryVo.markerIconOffline;
      categoryVo.markerIconOfflineFull = markerIconOffline == null || markerIconOffline.trim() == "" ? null : poiManageApiUrl + markerIconOffline.trim();
      if (subCategories != null && subCategories.length > 0)
        storeCategoryArray(subCategories, cacheArr);
    }
  }
}

function loadQueryMethods() {
  let url = poiManageApiUrl + "map/poi-query-method/listBriefAll";
  let invokeBefore = function() {
    return fetch(url, {
      headers: new Headers({
        'Content-Type': 'application/json',
        'Authorization': getTokenStr(),
      })
    }).then(AssistTool.checkRespOkToJson);
  };
  let invokeAfter = function(resultObj) {
    resultObj = AssistTool.regulateRestResult(resultObj);
    if (!resultObj.success) {
      AssistTool.showMessageTip(resultObj.message);
      return;
    }
    queryMethods = resultObj.data;
  };
  LoginModule.fetchAndCheck(invokeBefore, invokeAfter);
}

function loadQueryProtocols() {
  let url = poiManageApiUrl + "map/poi-manage/queryProtocolValues";
  let invokeBefore = function() {
    return fetch(url, {
      headers: new Headers({
        'Content-Type': 'application/json',
        'Authorization': getTokenStr(),
      })
    }).then(AssistTool.checkRespOkToJson);
  };
  let invokeAfter = function(resultObj) {
    resultObj = AssistTool.regulateRestResult(resultObj);
    if (!resultObj.success) {
      AssistTool.showMessageTip(resultObj.message);
      return;
    }
    queryProtocols = resultObj.data;
  };
  LoginModule.fetchAndCheck(invokeBefore, invokeAfter);
}

function loadSyncTypes() {
  let url = poiManageApiUrl + "map/poi-manage/syncTypeValues";
  let invokeBefore = function() {
    return fetch(url, {
      headers: new Headers({
        'Content-Type': 'application/json',
        'Authorization': getTokenStr(),
      })
    }).then(AssistTool.checkRespOkToJson);
  };
  let invokeAfter = function(resultObj) {
    resultObj = AssistTool.regulateRestResult(resultObj);
    if (!resultObj.success) {
      AssistTool.showMessageTip(resultObj.message);
      return;
    }
    syncTypes = resultObj.data;
  };
  LoginModule.fetchAndCheck(invokeBefore, invokeAfter);
}

function loadPortals() {
  let url = poiManageApiUrl + "map/poi-portal-manage/portal/list";
  let invokeBefore = function() {
    return fetch(url, {
      headers: new Headers({
        'Content-Type': 'application/json',
        'Authorization': getTokenStr(),
      })
    }).then(AssistTool.checkRespOkToJson);
  };
  let invokeAfter = function(resultObj) {
    resultObj = AssistTool.regulateRestResult(resultObj);
    if (!resultObj.success) {
      AssistTool.showMessageTip(resultObj.message);
      return;
    }

    portals = resultObj.data;
    for (let portal of portals) {
      let option = document.createElement("option");
      option.value = portal.id;
      option.text = portal.name;
      portalSelect.appendChild(option);
    }

    let currentPortalIdValue = localStorage.getItem("currentPortalId");
    if (currentPortalIdValue != null) {
      if (currentPortalIdValue == "0") {
        portalSelect.value = currentPortalIdValue;
      } else {
        let currentPortalId = parseInt(currentPortalIdValue);
        let index = portals.findIndex(p => p.id == currentPortalId)
        if (index == -1) {
          portalSelect.value = "";
          localStorage.removeItem("currentPortalId");
        } else {
          portalSelect.value = currentPortalIdValue;
        }
      }
    }
  };
  LoginModule.fetchAndCheck(invokeBefore, invokeAfter);
}

function loadCategoryTree() {
  let url = poiManageApiUrl + "map/poi-manage/categoryTree";
  let currentPortalId = localStorage.getItem("currentPortalId");
  if (currentPortalId != null) {
    url = url + "?portalId=" + currentPortalId;
  }

  let invokeBefore = function() {
    return fetch(url, {
      headers: new Headers({
        'Content-Type': 'application/json',
        'Authorization': getTokenStr(),
      })
    }).then(AssistTool.checkRespOkToJson);
  };
  let invokeAfter = function(resultObj) {
    resultObj = AssistTool.regulateRestResult(resultObj);
    if (!resultObj.success) {
      AssistTool.showMessageTip(resultObj.message);
      return;
    }

    let categories = resultObj.data;
    let treeGroups = categories.map(g => convertGroupItem(g));

    storeCategoriesCache(categories, treeGroups);

    fillSubNodes(rootGroupSubsContainer, treeGroups, null, 1, groupTreeNodeTemplate, simplexTreeNodeTemplate);
  };
  LoginModule.fetchAndCheck(invokeBefore, invokeAfter);
}

function convertGroupItem(groupItem) {
  let group = {
    id: groupItem.id,
    title: groupItem.name
  };
  let subGroups = [];
  group.subGroups = subGroups;
  let children = groupItem.children;
  if (children != null && children.length > 0) {
    for (let subGroup of children) {
      let treeSubGroup = convertGroupItem(subGroup);
      subGroups.push(treeSubGroup);
    }
  }

  return group;
}

function fillSubNodes(subsContainer, subGroups, subSimplexes, openLevels, groupNodeTemplate, simplexNodeTemplate, currentId) {
  // let subsContainer = groupElement.lastElementChild;
  subsContainer.innerHTML = "";
  if (subGroups != null && subGroups.length > 0) {
    let expanded = openLevels > 0;
    let subOpenLevels = openLevels - 1;
    for (let group of subGroups) {
      group.expanded = expanded;
      if (group.id == currentId)
        group.selected = true;
      let html = AssistTool.replaceTemplateWithObject(groupNodeTemplate, group);
      subsContainer.insertAdjacentHTML("beforeend", html);
      delete group.selected;

      let toggleIcon = subsContainer.lastElementChild.firstElementChild.firstElementChild;
      toggleIcon.onclick = function() {
        toggleChildrenShow(this);
      };

      let subGroupElement = subsContainer.lastElementChild;
      let subGroupSubsContainer = subGroupElement.lastElementChild;
      fillSubNodes(subGroupSubsContainer, group.subGroups, group.subSimplexes, subOpenLevels, groupNodeTemplate, simplexNodeTemplate, currentId);
    }
  }

  if (subSimplexes != null && subSimplexes.length > 0) {
    for (let simplex of subSimplexes) {
      if (simplex.id == currentId)
        simplex.selected = true;
      let html = AssistTool.replaceTemplateWithObject(simplexNodeTemplate, simplex);
      subsContainer.insertAdjacentHTML("beforeend", html);
      delete simplex.selected;
    }
  }
}

function toggleChildrenShow(toggleIcon) {
  let childrenDiv = toggleIcon.parentNode.parentNode.lastElementChild;
  var visiable = childrenDiv.style.display != "none";
  if (visiable) {
    childrenDiv.style.display = "none"
    toggleIcon.classList.remove("expanded");
    toggleIcon.classList.add("collapsed");
    toggleIcon.title = "展开";
  } else {
    childrenDiv.style.display = "block"
    toggleIcon.classList.remove("collapsed");
    toggleIcon.classList.add("expanded");
    toggleIcon.title = "折叠";
  }
}

function addCategorySubmit(form) {
  let formData = new FormData(form);
  let name = formData.get("name").trim();
  if (name == "") {
    AssistTool.showMessageTip("请输入类别名称");
    return;
  }
  let parentId = parseInt(formData.get("parentId"));
  if (isNaN(parentId)) {
    AssistTool.showMessageTip("父标识无效");
    return;
  }
  let imageUrl = formData.get("imageUrl");
  let markerIcon = formData.get("markerIcon");
  let markerIconOffline = formData.get("markerIconOffline");
  let isDisabled = formData.get("isDisabled") == "on";
  let code = formData.get("code");
  let isGb = formData.get("isGb") == "on";
  let isSystemReserved = formData.get("isSystemReserved") == "on";
  let dataProtocol = parseInt(formData.get("dataProtocol"));
  if (isNaN(dataProtocol))
    dataProtocol = null;
  let dataMethodId = parseInt(formData.get("dataMethodId"));
  if (isNaN(dataMethodId))
    dataMethodId = null;
  let itemFilterExpression = formData.get("itemFilterExpression");
  let syncType = parseInt(formData.get("syncType"));
  if (isNaN(syncType))
    syncType = null;
  let fixedTimeValue = formData.get("fixedTime");
  let fixedTime = null;
  if (fixedTimeValue != "") {
    let date = new Date(fixedTimeValue);
    fixedTime = AssistTool.formatDateTimeToTypicalString(date, false, false, true);
  }
  let cron = formData.get("cron");
  let addMethodId = parseInt(formData.get("addMethodId"));
  if (isNaN(addMethodId))
    addMethodId = null;
  let updateMethodId = parseInt(formData.get("updateMethodId"));
  if (isNaN(updateMethodId))
    updateMethodId = null;
  let deleteMethodId = parseInt(formData.get("deleteMethodId"));
  if (isNaN(deleteMethodId))
    deleteMethodId = null;
  let paramOrBody = formData.get("paramOrBody");
  let paramOrBodyAdd = formData.get("paramOrBodyAdd");
  let paramOrBodyUpdate = formData.get("paramOrBodyUpdate");
  let paramOrBodyDelete = formData.get("paramOrBodyDelete");
  let extraProperties = formData.get("extraProperties");
  let extraPropertiesAdd = formData.get("extraPropertiesAdd");
  let extraPropertiesUpdate = formData.get("extraPropertiesUpdate");
  let extraPropertiesDelete = formData.get("extraPropertiesDelete");

  let contentObj = {
    name,
    parentId,
    imageUrl,
    markerIcon,
    markerIconOffline,
    isDisabled,
    code,
    isGb,
    isSystemReserved,
    dataProtocol,
    dataMethodId,
    itemFilterExpression,
    syncType,
    fixedTime,
    cron,
    addMethodId,
    updateMethodId,
    deleteMethodId,
    paramOrBody,
    paramOrBodyAdd,
    paramOrBodyUpdate,
    paramOrBodyDelete,
    extraProperties,
    extraPropertiesAdd,
    extraPropertiesUpdate,
    extraPropertiesDelete
  };

  let url = poiManageApiUrl + "map/poi-manage/category-save";
  let invokeBefore = function() {
    return fetch(url, {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
        'Authorization': getTokenStr(),
      }),
      body: JSON.stringify(contentObj),
    }).then(AssistTool.checkRespOkToJson);
  };
  let invokeAfter = function(resultObj) {
    resultObj = AssistTool.regulateRestResult(resultObj);
    if (!resultObj.success) {
      AssistTool.showMessageTip(resultObj.message);
      return;
    }

    AssistTool.showMessageTip("添加成功。");
    loadCategoryTree();
    let newForm = addCategory(parentId);
    newForm.scrollIntoView();
  };
  LoginModule.fetchAndCheck(invokeBefore, invokeAfter);
}

function editCategorySubmit(form) {
  let formData = new FormData(form);
  let id = formData.get("id");
  let name = formData.get("name").trim();
  if (name == "") {
    AssistTool.showMessageTip("请输入类别名称");
    return;
  }
  let parentId = parseInt(formData.get("parentId"));
  if (isNaN(parentId)) {
    AssistTool.showMessageTip("父标识无效");
    return;
  }
  let imageUrl = formData.get("imageUrl");
  let markerIcon = formData.get("markerIcon");
  let markerIconOffline = formData.get("markerIconOffline");
  let isDisabled = formData.get("isDisabled") == "on";
  let code = formData.get("code");
  let isGb = formData.get("isGb") == "on";
  let isSystemReserved = formData.get("isSystemReserved") == "on";
  let dataProtocol = parseInt(formData.get("dataProtocol"));
  if (isNaN(dataProtocol))
    dataProtocol = null;
  let dataMethodId = parseInt(formData.get("dataMethodId"));
  if (isNaN(dataMethodId))
    dataMethodId = null;
  let itemFilterExpression = formData.get("itemFilterExpression");
  let syncType = parseInt(formData.get("syncType"));
  if (isNaN(syncType))
    syncType = null;
  let fixedTimeValue = formData.get("fixedTime");
  let fixedTime = null;
  if (fixedTimeValue != "") {
    let date = new Date(fixedTimeValue);
    fixedTime = AssistTool.formatDateTimeToTypicalString(date, false, false, true);
  }
  let cron = formData.get("cron");
  let addMethodId = parseInt(formData.get("addMethodId"));
  if (isNaN(addMethodId))
    addMethodId = null;
  let updateMethodId = parseInt(formData.get("updateMethodId"));
  if (isNaN(updateMethodId))
    updateMethodId = null;
  let deleteMethodId = parseInt(formData.get("deleteMethodId"));
  if (isNaN(deleteMethodId))
    deleteMethodId = null;
  let paramOrBody = formData.get("paramOrBody");
  let paramOrBodyAdd = formData.get("paramOrBodyAdd");
  let paramOrBodyUpdate = formData.get("paramOrBodyUpdate");
  let paramOrBodyDelete = formData.get("paramOrBodyDelete");
  let extraProperties = formData.get("extraProperties");
  let extraPropertiesAdd = formData.get("extraPropertiesAdd");
  let extraPropertiesUpdate = formData.get("extraPropertiesUpdate");
  let extraPropertiesDelete = formData.get("extraPropertiesDelete");

  let contentObj = {
    id,
    name,
    parentId,
    imageUrl,
    markerIcon,
    markerIconOffline,
    isDisabled,
    code,
    isGb,
    isSystemReserved,
    dataProtocol,
    dataMethodId,
    itemFilterExpression,
    syncType,
    fixedTime,
    cron,
    addMethodId,
    updateMethodId,
    deleteMethodId,
    paramOrBody,
    paramOrBodyAdd,
    paramOrBodyUpdate,
    paramOrBodyDelete,
    extraProperties,
    extraPropertiesAdd,
    extraPropertiesUpdate,
    extraPropertiesDelete
  };

  let url = poiManageApiUrl + "map/poi-manage/category-update";
  let invokeBefore = function() {
    return fetch(url, {
      method: 'PUT',
      headers: new Headers({
        'Content-Type': 'application/json',
        'Authorization': getTokenStr(),
      }),
      body: JSON.stringify(contentObj),
    }).then(AssistTool.checkRespOkToJson);
  };
  let invokeAfter = function(resultObj) {
    resultObj = AssistTool.regulateRestResult(resultObj);
    if (!resultObj.success) {
      AssistTool.showMessageTip(resultObj.message);
      return;
    }
    AssistTool.showMessageTip("修改成功。");
    loadCategoryTree();
  };
  LoginModule.fetchAndCheck(invokeBefore, invokeAfter);
}

const categoryQueryInput = document.getElementById("categoryQuery");

window.searchCategorySubmit = function() {

};

window.deleteCategory = function(id, name) {
  AssistTool.confirmDialog("你确定要删除该类别[" + name + "]吗？").then(function(result) {
    if (result) {
      let url = poiManageApiUrl + "map/poi-manage/category-delete/" + id;
      let invokeBefore = function() {
        return fetch(url, {
          method: 'DELETE',
          headers: new Headers({
            'Content-Type': 'application/json',
            'Authorization': getTokenStr(),
          }),
        }).then(AssistTool.checkRespOkToJson);
      };
      let invokeAfter = function(resultObj) {
        resultObj = AssistTool.regulateRestResult(resultObj);
        if (!resultObj.success) {
          AssistTool.showMessageTip(resultObj.message);
          return;
        }
        AssistTool.showMessageTip("类别删除成功");
        loadCategoryTree();
      };
      LoginModule.fetchAndCheck(invokeBefore, invokeAfter);
    }
  });
};

function initData() {
  portalSelect.onchange = function() {
    let portalId = parseInt(this.value);
    if (isNaN(portalId)) {
      localStorage.removeItem("currentPortalId");
    } else {
      localStorage.setItem("currentPortalId", portalId);
    }
    loadCategoryTree();
  };

  loadPortals();
  loadCategoryTree();
  loadSyncTypes();
  loadQueryProtocols();
  loadQueryMethods();
}

document.addEventListener("DOMContentLoaded", function() {
  PageSwitcher.init("tabSwitcher");
  let afterLogin = function(loginResult) {
    if (loginResult) {
      initData();
    }
  };
  LoginModule.init("loginBoard", "loginedInfoBar", "needLoginInfoBar", afterLogin);
});

window.AssistTool = AssistTool;
