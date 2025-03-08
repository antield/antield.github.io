let map = {};
let lastViewName = null;

export function selectTabView(viewName) {
  if (lastViewName != null) {
    let lastInfo = map[lastViewName];
    lastInfo.tab.classList.remove("current");
    lastInfo.page.style.display = "none";
  }
  let info = map[viewName];
  info.tab.classList.add("current");
  info.page.style.display = "block";
  lastViewName = viewName;
}

export function init(switcher, defaultView) {
  let switcherContainer
  if (switcher instanceof HTMLElement)
    switcherContainer = switcher;
  else
    switcherContainer = document.getElementById(switcher);
  let children = switcherContainer.children;
  for (let li of children) {
    let viewName = li.getAttribute("data-page");
    let info = {};
    info.tab = li;
    let pageName = viewName + "Page";
    info.page = document.getElementById(pageName);
    map[viewName] = info;
  }
  for (let li of children) {
    li.onclick = function() {
      let viewName = li.getAttribute("data-page");
      selectTabView(viewName);
    }
  }

  if (defaultView != null) {
    selectTabView(defaultView);
  } else {
    for (let li of children) {
      if (li.classList.contains("current")) {
        lastViewName = li.getAttribute("data-page");
        break;
      }
    }
  }
}
