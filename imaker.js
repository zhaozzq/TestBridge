(function () {

  if (window.imakerapi) {
    // Android加上了这个if判断，如果当前window已经定义了XuntongBridge对象，不再重新加载
    // 避免重新初始化_callback_map等变量，导致之前的消息回调失败，返回cb404
    //alert('window already has a XuntongBridge object!!!');
    return;
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////// 
  ///////////////////////////////////本地调用的实际逻辑////////////////////////////////////////////
  var callbacksCount = 1, callbacks = {};

  function _handleMessageFromApp(callbackId, message) {

    try {
      var callback = callbacks[callbackId];
      if (!callback) return;
      callback.apply(null, [message]);
    } catch (e) {
      alert(e)
    }
  }

  /**
   * 获取用户ua信息,判断OS
   * @returns {string}
   */
  function getOS() {
    var userAgent = navigator.userAgent;
    return userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/) ? 'ios' : userAgent.match(/Android/i) ? 'android' : '';
  }

  // Use this in javascript to request native objective-c code
  // functionName : string (I think the name is explicit :p)
  // message : map of arguments // message 必须有值，没有传空对象{}
  // callback : function with n-arguments that is going to be called when the native code returned
  function _call(functionName, message, callback) {
    //只有在手机或电脑端云之家中才允许调用Xuntong JSBridge
    if (!getOS()) return false;
    var hasCallback = callback && typeof callback == "function";
    var callbackId = hasCallback ? callbacksCount++ : 0;

    if (hasCallback)
      callbacks[callbackId] = callback;

    if (getOS() == 'ios') {
      window.webkit.messageHandlers.pushWindow.postMessage({
        "function": functionName,
        "callbackId": callbackId,
        "message": message// message 必须有值，没有传空对象{}
      });
    } else if (getOS == 'android') {
      imaker.pushWindow(functionName, message, callbackId); //android 需实现imaker
    }
  }

  function _pushWindow(url, title, hiddenNavBar) {
    if (getOS() == 'ios') {
      window.webkit.messageHandlers.pushWindow.postMessage({
        "url": url,
        "title": title,
        "hiddenNavBar": hiddenNavBar
      });
    } else if (getOS == 'android') {
      imaker.pushWindow(url, title, hiddenNavBar); //android 需实现imaker
    }
  }

  function _closeWindow() {
    if (getOS() == 'ios') {
      window.webkit.messageHandlers.closeWindow.postMessage({});
    } else if (getOS == 'android') {
      imaker.closeWindow(functionName, message, callbackId); //android 需实现imaker
    }
  }

  var __imakerapi = {
    invoke: _call,
    call: _call,
    callbackHandler: _handleMessageFromApp,
    //convenience
    closeWindow: _closeWindow,
    pushWindow: _pushWindow
  };

  window.imakerapi = __imakerapi;

})();