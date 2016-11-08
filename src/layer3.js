/**
 * IPv4アドレスを表現するクラス
 */
function IPv4(ip) {
  this.set(ip)
}
(function(){

  /**
   * static
   * IPv4フォーマットであることの判定
   * @param {string} str 検査文字列
   */
  IPv4.isValid = function(str) {
    var regexIP = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
    return (str.match(regexIP)) ? true : false
  }

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
    return (this.uint() === new IPv4(to).uint())
  }
}())


/**
 * ルーティングテーブルのレコードを表現するクラス
 * @param {string}    type     経路タイプ{direct, static, rip}
 * @param {IPv4}      net      アドレス
 * @param {IPv4}      mask     サブネット
 * @param {object}    nextHop  ネクストホップ/ゲートウェイ
 * @param {string}    portName インターフェイス名
 * @param {number}    distance Administrative Distance/Route Preference
 */
function Route(type, net, mask, nextHop, portName, distance) {
  this.type = type
  this.net = new IPv4(net)
  this.mask = new IPv4(mask)
  this.nextHop = nextHop
  this.portName = portName
  this.distance = (distance !== undefined) ? distance : 0
}
Route.prototype.constructor = Route


/**
 * レイヤー3デバイスを表現するクラス
 */
function Layer3Device(interfaces, receiveCallBack, tcpReceiveCallback) {
  Layer2Device.call(this, interfaces, receiveCallBack)
  this.arp = []
  this.route = []
  this.sequence = 0
  this.tcp = {}

  if (typeof receiveCallBack === 'function') {
    this.receiveCallBack = receiveCallBack
  }
  if (typeof tcpReceiveCallback === 'function') {
    this.tcpReceiveCallback = tcpReceiveCallback
  }

  return this
}
(function() {
  /* derived */
  Layer3Device.prototype = Object.create(Layer2Device.prototype)

  /**
   * L3 パケットの受信
   * TODO: 巨大になったら分割
   * @param {Interface} srcPort 外部から受信したインターフェイス
   * @param {object}    recv    受信データ
   */
  Layer3Device.prototype.receive = function(srcPort, recv) {

    // L2ポートである場合はL2スイッチと同様の動作
    if (srcPort.isSwitchPort) {
      return Layer2Device.prototype.transfer.call(this, srcPort, new MAC(recv.sourceMACAddress), new MAC(recv.destinationMACAddress), recv)
    }

    if (recv.data.protocol === 'arp' && recv.data.operation === '1') {
      //var sender = srcPort.getConnection().otherSide(srcPort)
      return this.sendARPResponse(srcPort, recv)
    }

    if (recv.data.protocol === 'arp' && recv.data.operation === '2') {
      //var recievedInterface = srcPort.getConnection().otherSide(srcPort)
      return this.arp.push([srcPort.name, recv.data.sourceIPAddress, recv.data.sourceMACAddress, 'dynamic'])
    }

    var L3packet = recv.data

    // receive ICMP Echo reply
    if (L3packet.data.protocol === 'icmp' && L3packet.data.type === 8) {
      return this.sendICMPEchoReply(srcPort, recv)
    }

    // receive tcp
    if (L3packet.data.protocol === 'tcp') {

      if (this.tcp[L3packet.data.destinationPort] === undefined) {
        this.tcp[L3packet.data.destinationPort] = {}
      }

      // process tcp 3way handshake
      if (!L3packet.data.urg &&
        !L3packet.data.ack &&
        !L3packet.data.psh &&
        !L3packet.data.rst &&
        L3packet.data.syn &&
        !L3packet.data.fin
      ) {
        if (this.tcp[L3packet.data.destinationPort].status === undefined ||
           this.tcp[L3packet.data.destinationPort].status === 'LISTEN')
        {
          this.tcp[L3packet.data.destinationPort].status = 'SYN_RECEIVED'
          return this.sendTCPAckSyn(srcPort, recv)
        }
        else if (this.tcp[L3packet.data.destinationPort].status === 'ESTABLISHED') {
          if (this.tcpReceiveCallback) {
            this.tcpReceiveCallback(srcPort, recv)
          }
          return this.sendTCPAck(srcPort, recv)
        }
      }


      if (!L3packet.data.urg &&
        L3packet.data.ack &&
        !L3packet.data.psh &&
        !L3packet.data.rst &&
        L3packet.data.syn &&
        !L3packet.data.fin
      ) {
        if (this.tcp[L3packet.data.destinationPort].status === 'SYN_SENT') {
          this.tcp[L3packet.data.destinationPort].status = 'ESTABLISHED'
          return this.sendTCPAck(srcPort, recv)
        }
      }


      if (!L3packet.data.urg &&
        L3packet.data.ack &&
        !L3packet.data.psh &&
        !L3packet.data.rst &&
        !L3packet.data.syn &&
        !L3packet.data.fin
      ) {
        if (this.tcp[L3packet.data.destinationPort].status === 'SYN_RECEIVED') {
          this.tcp[L3packet.data.destinationPort].status = 'ESTABLISHED'
          return true
        }
      }
    }


    if (this.receiveCallBack) {
      return this.receiveCallBack(srcPort, recv)
    } else {
      // ルーティング
      return this.transfer(srcPort, recv)
    }
  }


  /**
   * 受信したパケットを装置内の他のインターフェイスに転送する(ルーティング)
   * @param {Interface} srcPort 外部からのデータを受信したインターフェイス
   * @param {object}    packet  受信データ
   */
  Layer3Device.prototype.transfer = function(srcPort, frame) {

    // ルーティングテーブルを参照し、該当するルートを選択する
    var route = this._refRoutingTable(new IPv4(frame.data.destinationIPAddress))
    if (!route)
      return false// 適切なルートが存在しないためパケット破棄

    var nextHopAddr
    // if nextHop is IP address
    if (IPv4.isValid(route.nextHop)) {
      nextHopAddr = new IPv4(route.nextHop)
      this.sendARPRequest(this.getInterface(route.portName), nextHopAddr)
    } else {
      // if nextHop is interface name
      nextHopAddr = new IPv4(frame.data.destinationIPAddress)
      this.sendARPRequest(this.getInterface(route.nextHop), nextHopAddr)
    }


    var nextHopMAC
    var nextSrcPortName
    for (var i = 0; i < this.arp.length; i++) {
      var arp = this.arp[i]
      if (nextHopAddr.equals(arp[1])) {
        nextSrcPortName = arp[0]
        nextHopMAC = new MAC(arp[2])
        break
      }
    }
    if (!nextHopMAC)
      return false// MACアドレスが見つからなかったためパケット破棄

    var packet = {
      'sourceIPAddress' : frame.data.sourceIPAddress,
      'destinationIPAddress' : frame.data.destinationIPAddress,
      'data' : frame.data.data
    }

    return Layer2Device.prototype.send.call(this, nextSrcPortName, nextHopMAC, packet)
  }


  /**
   * IPアドレスの設定
   */
  Layer3Device.prototype.setIP = function(ifname_and_ip) {
    if (!(ifname_and_ip instanceof Array))
      return this

    for (var i=0; i < ifname_and_ip.length; i++) {
      this.getInterface(ifname_and_ip[i][0]).ip = new IPv4(ifname_and_ip[i][1])
      this.getInterface(ifname_and_ip[i][0]).mask = (ifname_and_ip[i][2]) ? new IPv4(ifname_and_ip[i][2]) : new IPv4('255.255.255.255')
      this.getInterface(ifname_and_ip[i][0]).isSwitchPort = false
    }

    this._addDirectConnectionRoute()
    return this
  }

  /**
   * スタティックルーティングの設定
   */
  Layer3Device.prototype.setRoute = function(route) {
    if (typeof route === 'object' || route instanceof Array) {
      if (route.length > 0 && !(route[0] instanceof Route))
        throw new Error('bad type')
      Array.prototype.push.apply(this.route, route)
    }
    if (route instanceof Route)
      this.route.push(route)
    return this
  }

  /**
   * 宛先IPアドレスに対してデータを送信する
   * @param {string} srcPortName
   * @param {IPv4}    destIPaddr
   * @param {object}  data
   * @param {IPv4} srcIPaddr
   */
  Layer3Device.prototype.send = function(srcPortName, destIPaddr, data, srcIPaddr) {

    if (typeof srcPortName !== 'string')
      { throw new Error('bad type') }
    if (!(srcIPaddr instanceof IPv4 || srcIPaddr === undefined))
      { throw new Error('bad type') }
    if (!(destIPaddr instanceof IPv4))
      { throw new Error('bad type') }

    if (srcIPaddr === undefined) {
      srcIPaddr = this.getInterface(srcPortName).ip
    }

    var route = this._refRoutingTable(destIPaddr)
    if (!route)
      return false // 適切なルートが存在しないためパケット破棄

    // same network range if nexthop is string
    var nextHopAddr
    if (IPv4.isValid(route.nextHop)) {
      nextHopAddr = new IPv4(route.nextHop)
    } else {
      nextHopAddr = destIPaddr
    }

    // ARPキャッシュを参照
    var nextHopMAC
    this.arp.forEach(function(arp) {
      if (nextHopAddr.equals(arp[1])) {
        nextHopMAC = new MAC(arp[2])
        return
      }
    })
    if (!nextHopMAC){
      // ARPキャッシュに見つからなかった場合はARPリクエストを送信
      this.sendARPRequest(this.getInterface(srcPortName), nextHopAddr)
      this.arp.forEach(function(arp) {
        if (nextHopAddr.equals(arp[1])) {
          nextHopMAC = new MAC(arp[2])
          return
        }
      })
      if (!nextHopMAC)
        return false // MACアドレスが見つからないため、パケット破棄
    }


    var packet = {
      'sourceIPAddress' : srcIPaddr,
      'destinationIPAddress' : destIPaddr,
      'data' : data
    }

    return Layer2Device.prototype.send.call(this, srcPortName, nextHopMAC, packet)
  }

  /**
   * ARPリクエストを送信する
   * @param {Interface} srcPort 送信するインターフェイス
   * @param {IPv4}      resolveTarget 対象IPアドレス
   */
  Layer3Device.prototype.sendARPRequest = function(srcPort, resolveTarget) {

    var arpReq = {
      'protocol' : 'arp',
      'operation' : '1',
      'sourceIPAddress' : srcPort.ip.str(),
      'sourceMACAddress' : srcPort.mac.str(),
      'destinationIPAddress' : new IPv4(resolveTarget).str(),
      'destinationMACAddress' : '00-00-00-00-00-00'
    }
    return Layer2Device.prototype.send.call(this, srcPort.name, new MAC('ff-ff-ff-ff-ff-ff'), arpReq)
  }

  /**
   * ARP応答を送信する
   * @param {Interface} srcPort    送信するポート
   * @param {object}    recv       ARPリクエストを含むデータ
   */
  Layer3Device.prototype.sendARPResponse = function(srcPort, recv) {

    // 問い合わせIPアドレスを持っていなければ応答しない
    if (!srcPort.ip || !srcPort.ip.equals(recv.data.destinationIPAddress))
      return false

    var arpRes = {
      'protocol' : 'arp',
      'operation' : '2',
      'sourceIPAddress' : srcPort.ip.str(),
      'sourceMACAddress' : srcPort.mac.str(),
      'destinationIPAddress' : recv.data.sourceIPAddress,
      'destinationMACAddress' : recv.data.sourceMACAddress
    }
    return Layer2Device.prototype.send.call(this, srcPort.name, new MAC(arpRes.destinationMACAddress), arpRes)
  }

  /**
   * ICMPを送信する
   */
  Layer3Device.prototype.sendICMPEcho = function(srcPortName, targetIP, sequence) {

    var icmpReq = {
      'protocol' : 'icmp',
      'type' : 8, // icmp echo
      'code' : 0,
      'checksum' : 'dummy',
      'identifier' : 0,
      'sequence' : sequence,
      'data' : 'abcdefghijklmnopqrstuvwabcdefghi'
    }
    return this.send(srcPortName, targetIP, icmpReq)
  }

  /**
   * ICMP Echo Reply
   *
   */
  Layer3Device.prototype.sendICMPEchoReply = function(srcPort, recv) {
    var icmpRes = {
      'protocol' : 'icmp',
      'type' : 0, // icmp echo reply
      'code' : 0,
      'checksum' : 'dummy',
      'identifier' : 0,
      'sequence' : recv.data.data.sequence,
      'data' : 'abcdefghijklmnopqrstuvwabcdefghi'
    }
    return this.send(srcPort.name, recv.data.sourceIPAddress, icmpRes)
  }

  /**
   * TCP 送信
   */
  Layer3Device.prototype.sendTCP = function(ip, srcPort, destPort, data) {
    if (!this.interfaces) return false
    if (!this.interfaces[0].ip) return false
    if (typeof srcPort !== 'number') return false
    if (0 > srcPort || 65535 < srcPort) return false
    if (0 > destPort || 65535 < destPort) return false

    var route = this._refRoutingTable(ip)
    if (!route)
      return false

    var packet = {
      'protocol' : 'tcp',
      'sourcePort' : srcPort,
      'destinationPort' : destPort,
      'sequence' : ++this.sequence,
      'acknowledgment' : 0,
      'urg' : false,
      'ack' : false,
      'psh' : false,
      'rst' : false,
      'syn' : true,
      'fin' : false,
    }
    this.sequence += 160
    if (!this.tcp[srcPort]) this.tcp[srcPort] = {}
    this.tcp[srcPort].status = 'SYN_SENT'
    if (this.send(this.interfaces[0].name, ip, packet)) {
      console.log("tcp 3way handshake is done")
      packet.data = data
      this.send(this.interfaces[0].name, ip, packet)
    }
  }

  Layer3Device.prototype.sendTCPAckSyn = function(srcPort, recv) {
    this.sequence += 160
    var packet = {
      'protocol' : 'tcp',
      'sourcePort' : recv.data.data.destinationPort,
      'destinationPort' : recv.data.data.sourcePort,
      'sequence' : this.sequence+1,
      'acknowledgment' : this.sequence+1,
      'urg' : false,
      'ack' : true,
      'psh' : false,
      'rst' : false,
      'syn' : true,
      'fin' : false,
    }
    return this.send(this.interfaces[0].name, recv.data.sourceIPAddress, packet)
  }

  Layer3Device.prototype.sendTCPAck = function(srcPort, recv) {
    this.sequence += 160
    var packet = {
      'protocol' : 'tcp',
      'sourcePort' : recv.data.data.destinationPort,
      'destinationPort' : recv.data.data.sourcePort,
      'sequence' : this.sequence+1,
      'acknowledgment' : recv.data.data.sequence+161,
      'urg' : false,
      'ack' : true,
      'psh' : false,
      'rst' : false,
      'syn' : false,
      'fin' : false,
    }
    return this.send(this.interfaces[0].name, recv.data.sourceIPAddress, packet)
  }

  /**
   * private
   * 直接接続ルートの追加 ( ip/32 と ip & mask を追加)
   */
  Layer3Device.prototype._addDirectConnectionRoute = function() {
    for (var i = 0; i < this.interfaces.length; i++) {
      var val = this.interfaces[i]
      this.route.push(new Route('direct', val.ip, new IPv4('255.255.255.255'), val.name, val.name, 0))
      this.route.push(new Route('direct', val.ip.networkAddr(val.mask), val.mask, val.name, val.name, 0))
    }
  }


  /**
   * private
   * ルーティングテーブルを参照し、該当するルートを取得する。
   */
  Layer3Device.prototype._refRoutingTable = function(destAddr) {
    if (!(destAddr instanceof IPv4))
      throw new Error('bad type')

    var longest = 0 >>> 0, longestMatchRoute
    for (var i=0; i < this.route.length; i++) {
      var route = this.route[i]
      if ((route.net.uint() & route.mask.uint()) === (destAddr.uint() & route.mask.uint())) {
        if (longest <= route.mask.uint()) {
          longestMatchRoute = route
          longest = route.mask.uint()
        }
      }
    }
    return longestMatchRoute
  }



})()
Layer3Device.prototype.constructor = Layer3Device
