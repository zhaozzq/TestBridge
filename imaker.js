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

  function isNebula() {
    var userAgent = navigator.userAgent;
    return userAgent.match(/Nebula/i) ? true : false;
  }
  // Use this in javascript to request native objective-c code
  // functionName : string (I think the name is explicit :p)
  // message : map of arguments // message 必须有值，没有传空对象{}
  // callback : function with n-arguments that is going to be called when the native code returned
  function _call(functionName, message, callback) {
    //只有在手机或电脑端云之家中才允许调用Xuntong JSBridge
    if (message == undefined) {
      message = {};
    }

    if (isNebula()) {
      AlipayJSBridge.call(functionName, message, callback);
      return
    }

    if (!getOS()) return false;
    var hasCallback = callback && typeof callback == "function";
    var callbackId = hasCallback ? callbacksCount++ : 0;

    if (hasCallback) {
      callbacks[callbackId] = callback;
    }
    
    if (getOS() == 'ios') {
      window.webkit.messageHandlers.callAppMessageHandler.postMessage({
        "function": functionName,
        "callbackId": callbackId,
        "message": message// message 必须有值，没有传空对象{}
      });
    } else if (getOS == 'android') {
      imaker.callAppMessageHandler(functionName, message, callbackId); //android 需实现imaker
    }
  }

  function _pushWindow(url, title, hiddenNavBar) {
    _call("pushWindow", {
      "url": url,
      "title": title,
      "hiddenNavBar": hiddenNavBar
    });
  }

  function _closeWindow() {
    _call("closeWindow",{});
  }

  function _scanQRCode(callback) {
    if (isNebula()) {
      AlipayJSBridge.call('scan', {
        type: 'qr',
      }, function(result) {
        let error = result.error;
        var data = {
          code: error,
          data: result.qrCode ? result.qrCode: result.barCode
        }
        if (error == 10 || error == 11) {
          data.desc = error == 10 ? "用户取消" : "操作失败";
        } else {
          data.code = 0;
          data.desc = "";
        }
        callback(data);
      });
      return;
    }
    _call("scanQRCode",{},callback);
  }


  var __imakerapi = {
    invoke: _call,
    call: _call,
    callbackHandler: _handleMessageFromApp,
    //convenience function
    closeWindow: _closeWindow,
    pushWindow: _pushWindow,
    scanQRCode: _scanQRCode,
  };

  window.imakerapi = __imakerapi;

})();