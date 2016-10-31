/**
 * IPv4アドレスを表現するクラス
 */
function IPv4(ip) {
  this.set(ip)
}
(function(){

  /**
   * オブジェクトにアドレスをセット
   * @param {number|string|object} IPアドレス
   */
  IPv4.prototype.set = function(ip) {
    try {
      if (ip == null) {
        this.octet = [null, null, null, null]
        return
      }

      if (typeof ip === 'number') {
        ip = ip >>> 0
        this.octet = [(ip & (0xff << 24)) >>> 24, (ip & (0xff << 16)) >>> 16, (ip & (0xff << 8)) >>> 8, ip & 0xff]
        return
      }
      else if (ip instanceof IPv4) {
        this.octet = ip.octet
        return
      }

      var regexIP = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
      if (!ip.match(regexIP)) {
        throw new Error("bad address.: " + ip)
      }

      this.octet = regexIP.exec(ip).slice(1).map(function(o) { return parseInt(o) })
      for (var n in this.octet)
        if (this.octet[n] < 0 || 255 < this.octet[n]) throw new Error("Invalid ip range.: " + ip)
      return
    }
    catch(e) {
      console.log(e)
    }
  }

  /**
   * 12.34.56.78 形式で取得
   */
  IPv4.prototype.str = function() {
    return this.octet[0] + '.' + this.octet[1] + '.' + this.octet[2] + '.' + this.octet[3]
  }

  /**
   * unsinged int で取得
   */
  IPv4.prototype.uint = function () {
    return ((this.octet[0] << 24) + (this.octet[1] << 16) + (this.octet[2] << 8) + this.octet[3]) >>> 0
  }

  /**
   * ネットマスクを与えるとネットワークアドレスを計算
   * @param {IPv4} サブネットマスク
   */
  IPv4.prototype.networkAddr = function(mask) {
    if (!(mask instanceof IPv4)) throw new Error('bad type')
    var ip = this.uint()
    var maskbit = mask.uint()
    return new IPv4(ip & maskbit)
  }

  /**
   * ネットマスクを与えるとブロードキャストアドレスを計算
   * @param {IPv4} サブネットマスク
   */
  IPv4.prototype.broadcastAddr = function(mask) {
    if (!(mask instanceof IPv4)) throw new Error('bad type')
    var ip = this.uint()
    var maskbit = mask.uint()
    return new IPv4((ip & maskbit) + (~maskbit))
  }

  /**
   * 比較
   */
  IPv4.prototype.equals = function(to) {
    return (this.uint() == new IPv4(to).uint())
  }
}())

/**
 * レイヤー3デバイスを表現するクラス
 */
function Layer3Device(interfaces, receiveCallBack) {
  Layer2Device.call(this, interfaces, receiveCallBack)
  this.arp = []

  if (receiveCallBack) {
    this.receiveCallBack = receiveCallBack
  }

  return this
}
(function(){
  /* derived */
  Layer3Device.prototype = Object.create(Layer2Device.prototype)

  /**
   * L3 パケットの受信
   * TODO: 巨大になったら分割
   */
  Layer3Device.prototype.receive = function(srcPort, recv) {

    if (recv.data['protocol'] == 'arp' && recv.data['operation'] == '1') {
      var sender = srcPort.getConnection().otherSide(srcPort)
      this.sendARPResponse(sender, recv)
    }

    if (recv.data['protocol'] == 'arp' && recv.data['operation'] == '2') {
      var recievedInterface = srcPort.getConnection().otherSide(srcPort)
      this.arp.push([recievedInterface.name, recv.data.sourceIPAddress, recv.data.sourceMACAddress, 'dynamic'])
    }

    if (this.receiveCallBack) {
      this.receiveCallBack(srcPort, recv)
    } else {
      // ルーティング
      var other = srcPort.getConnection().otherSide(srcPort)
      this.transfer(srcSwitchPort, recv.sourceMACAddress, recv.destinationMACAddress, recv)
    }
  }

  /**
   * IPアドレスの設定
   */
  Layer3Device.prototype.setIP = function(ifname_and_ip) {
    if (!(ifname_and_ip instanceof Array)) return this
    for (var i=0; i < ifname_and_ip.length; i++) {
      this.getInterface(ifname_and_ip[i][0]).ip = new IPv4(ifname_and_ip[i][1])
    }
    return this
  }

  /**
   * スタティックルーティングの設定
   */
  Layer3Device.prototype.setRoute = function(route) {
    this.route = route
    return this
  }

  /**
   * 宛先IPアドレスに対してデータを送信する
   */
  Layer3Device.prototype.send = function(srcPortName, destIPaddr, data, srcIPaddr = null) {

    if (typeof srcPortName !== 'string')
      { throw new Error('bad type') }
    if (!(srcIPaddr instanceof IPv4 || srcIPaddr == null))
      { throw new Error('bad type') }
    if (!(destIPaddr instanceof IPv4))
      { throw new Error('bad type') }

    if (srcIPaddr == null) {
      srcIPaddr = this.getInterface(srcPortName).ip
    }

    var packet = {
      'sourceIPAddress' : srcIPaddr,
      'destinationIPAddress' : destIPaddr,
      'data' : data
    }
    this.sendARPRequest(srcPortName, destIPaddr)

    $('#result').html(JSON.stringify(this.arp))
  }

  /**
   * ARPリクエストを送信する
   * @param {Interface} srcPortName 送信するポート
   * @param {IPv4}      resolveTarget 対象IPアドレス
   */
  Layer3Device.prototype.sendARPRequest = function(srcPortName, resolveTarget) {

    var arpReq = {
      'protocol' : 'arp',
      'operation' : '1',
      'sourceIPAddress' : this.getInterface(srcPortName).ip.str(),
      'sourceMACAddress' : this.getInterface(srcPortName).mac.str(),
      'destinationIPAddress' : new IPv4(resolveTarget).str(),
      'destinationMACAddress' : '00-00-00-00-00-00'
    }
    Layer2Device.prototype.send.call(this, srcPortName, new MAC('ff-ff-ff-ff-ff-ff'), arpReq)
  }

  /**
   * ARP応答を送信する
   * @param {Interface} srcPort      送信するポート
   * @param {object}    receivedData ARPリクエストを含むデータ
   */
  Layer3Device.prototype.sendARPResponse = function(srcPort, receivedData) {

    if (!srcPort.ip.equals(receivedData.data.destinationIPAddress))
      return

    var arpRes = {
      'protocol' : 'arp',
      'operation' : '2',
      'sourceIPAddress' : srcPort.ip.str(),
      'sourceMACAddress' : srcPort.mac.str(),
      'destinationIPAddress' : receivedData.sourceIPAddress,
      'destinationMACAddress' : receivedData.sourceMACAddress
    }
    Layer2Device.prototype.send.call(this, srcPort.name, new MAC(arpRes.destinationMACAddress), arpRes)
  }
})()
Layer3Device.prototype.constructor = Layer3Device
