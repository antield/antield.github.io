export default function renderPager(pageIndex, pageSize, totalCount, pagerHolder, jumpPageFunctionName) {
  let pageCount = Math.ceil(totalCount / pageSize);
  let jumpPageFunctionStr = "jumpPage";
  if (jumpPageFunctionName != undefined)
    jumpPageFunctionStr = jumpPageFunctionName;

  let htmlArr = [];
  htmlArr.push("<span class=\"PaginationSpan\">");
  if (pageIndex == 1) {
    htmlArr.push("<a class=\"PrevPage\" title='上一页'>❮</a>");
  } else {
    htmlArr.push("<a class=\"PrevPage\"  href='javascript:;' onclick=\"" + jumpPageFunctionStr + "(" + (pageIndex - 1).toString() + "," + pageSize + ");\" title='上一页'>❮</a>");
  }
  if (pageCount < 10) {
    for (let i = 1; i <= pageCount; i++) {
      if (pageIndex == i) {
        htmlArr.push("<a class=\"current\">" + i + "</a>");
      } else {
        htmlArr.push("<a  href='javascript:;' onclick=\"" + jumpPageFunctionStr + "(" + i + "," + pageSize + ");\">" + i + "</a>");
      }
    }
  } else {
    if (pageIndex <= 5) {
      for (let i = 1; i <= 7; i++) {
        if (pageIndex == i) {
          htmlArr.push("<a class=\"current\">" + i + "</a>");
        } else {
          htmlArr.push("<a href='javascript:;' onclick=\"" + jumpPageFunctionStr + "(" + i + "," + pageSize + ");\">" + i + "</a>");
        }
      }
      htmlArr.push("<a class=\"ellipsis\">…</a>");
      htmlArr.push("<a href='javascript:;' onclick=\"" + jumpPageFunctionStr + "(" + pageCount + "," + pageSize + ");\">" + pageCount + "</a>");
    } else if (pageIndex > pageCount - 5) {
      htmlArr.push("<a  href='javascript:;' onclick=\"" + jumpPageFunctionStr + "(1," + pageSize + ");\">1</a>");
      htmlArr.push("<a class=\"ellipsis\">…</a>");
      for (let i = pageCount - 7 + 1; i <= pageCount; i++) {
        if (pageIndex == i) {
          htmlArr.push("<a class=\"current\">" + i + "</a>");
        } else {
          htmlArr.push("<a href='javascript:;' onclick=\"" + jumpPageFunctionStr + "(" + i + "," + pageSize + ");\">" + i + "</a>");
        }
      }
    } else {
      htmlArr.push("<a href='javascript:;' onclick=\"" + jumpPageFunctionStr + "(1," + pageSize + ");\">1</a>");
      htmlArr.push("<a class=\"ellipsis\">…</a>");
      for (let i = pageIndex - 2; i <= pageIndex + 2; i++) {
        if (pageIndex == i) {
          htmlArr.push("<a class=\"current\">" + i + "</a>");
        } else {
          htmlArr.push("<a href='javascript:;' onclick=\"" + jumpPageFunctionStr + "(" + i + "," + pageSize + ");\">" + i + "</a>");
        }
      }
      htmlArr.push("<a class=\"ellipsis\">…</a>");
      htmlArr.push("<a href='javascript:;' onclick=\"" + jumpPageFunctionStr + "(" + pageCount + "," + pageSize + ");\">" + pageCount + "</a>");
    }
  }

  if (pageIndex == pageCount || pageIndex > pageCount) {
    htmlArr.push("<a class=\"NextPage\" title='下一页'>❯</a>");
  } else {
    htmlArr.push("<a href='javascript:;' onclick=\"" + jumpPageFunctionStr + "(" + (pageIndex + 1).toString() + "," + pageSize + ");\" title='下一页'>❯</a>");
  }
  htmlArr.push("</span>");
  let htmlStr = htmlArr.join("");
  pagerHolder.innerHTML = htmlStr;
}
