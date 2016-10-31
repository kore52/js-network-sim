
function MAC(macAddr) {
    
    if (macAddr instanceof MAC) {
        this.mac = macAddr.mac
        return
    }

    // 00:00:00:00:00:00
    // ff-ff-ff-ff-ff-ff のパターンマッチ
    var macAddrMatch1 = mac.match(/^([0-9a-fA-F]{2})[-:]([0-9a-fA-F]{2})[-:]([0-9a-fA-F]{2})[-:]([0-9a-fA-F]{2})[-:]([0-9a-fA-F]{2})[-:]([0-9a-fA-F]{2})$/)
    if (typeof macAddr === 'string' && macAddrMatch1) {
        this.mac = macAddrMatch1.map((v) => {return parseInt(v)})
        return
    }
    
    // FFFF:FFFF:FFFF のパターンマッチ
    var macAddrMatch2 = mac.match(/^([0-9a-fA-F]{2})([0-9a-fA-F]{2})[:]([0-9a-fA-F]{2})([0-9a-fA-F]{2})[:]([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/)
    if (typeof macAddr === 'string' && macAddrMatch2) {
        this.mac = macAddrMatch2.map((v) => {return parseInt(v)})
        return
    }
}
MAC.prototype {

    /**
     * MACアドレスを文字列形式で返す
     *  (書式: 00:00:00:00:00:00)
     */
    str : function() {
        return this.mac[0].toString(16)+':'+this.mac[1].toString(16)+':'+this.mac[2].toString(16)+':'+this.mac[3].toString(16)+':'+this.mac[4].toString(16)+':'+this.mac[5].toString(16)
    }
    
    equals : function(to) {
        var cmp = new MAC(to)
        for (var i=0; i<cmp.mac.length; i++) {
            if (this.mac[i] != cmp.mac[i]) return false
        }
        return true
    }
}

function Interface(name) {
    this.name = name
    this.isConnect = false
}
Interface.prototype = {
    connect : function(to) {
        if (!this.connection) this.connection = new Connection()
        this.connection.connect(to)
        to.connection = this.connection
        to.connection.connect(this)
    },
    
    disconnect : function(from) {
        if (!this.connection) { throw new Error('call disconnect(), but IF is null') }
        this.connection.disconnect(from)
        from.connection.disconenct(this)
        this.connection = null
    },
    
    getConnection : function() {
        return this.connection
    },
    
    /**
     * 対向のインターフェイスにデータを転送する。
     * 処理は Connection.transfer() に委譲
     * @param data 転送データ
     */
    transfer : function(data) {
        var other_side = (this != this.connection.connected[0]) ? this.connection.connected[0] : this.connection.connected[1]
        other_side.transfer(other_side, data)
    }
}

function Layer2Device(interfaces) {
    this.interfaces = interfaces
    this.mac_addr_table = {}
}
Layer2Device.prototype = {

    /**
     * インターフェイスに接続する
     */
    connect : function(ifname, to) {
        if (!(to instanceof Interface)) throw new Error('bad connect')
        this.getInterface(ifname).connect(to)
    },

    /**
     * インターフェイスから切断する
     */
    disconnect : function(ifname, from) {
        if (!(from instanceof Interface)) throw new Error('bad connect')
        this.getInterface(ifname).disconnect(from)
    },
    
    /**
     * インターフェイス名に合致するのインターフェイスを取得
     * @param {string} ifname インターフェイス名
     */
    getInterface : function(ifname) {
        for(var i = 0; i < this.interfaces.length; i++) {
            if (ifname === this.interfaces[i].name)
                return this.interfaces[i]
        }
    }
    
    /**
     * L2フレームを宛先MACアドレスから別ポートに転送する
     * @param srcMAC  送信元MACアドレス
     * @param destMAC 宛先MACアドレス
     * @param data    送信データ
     */
    send : function(srcMAC, destMAC, data) {
        var src_port = 
        var frame = {
            'frame' : {
                'sourceMACAddress' : srcMAC,
                'destinationMACAddress' : destMAC,
                'data' : data
            }
        }
        src_port.transfer(frame)
    }

    /**
     * L2フレームを受信する
     * @param data    受信データ
     */
    receive : function(data) {
    },
    
    /**
     * private
     * MACアドレステーブルへ追加する。
     * MAC重複が検出された場合は何もしない
     * @param ifname インターフェイス名
     * @param mac    MACアドレス
     */
    _add_mac_table : function(ifname, mac) {
        for (var i=0; i < this.mac_addr_table.length; i++) {
            if (mac == this.mac_addr_table[i][1]) {
                return
            }
        }
        this.mac_addr_table.push([ifname, mac])
    }
    
    /**
     * private
     * IEEE802.1Dによると300秒アクセスがないポートはテーブルから削除される
     * @param ifname インターフェイス名
     * @param mac    MACアドレス
     */
    _del_mac_table : function(ifname, to) {
        for (var i=0; i < this.mac_addr_table.length; i++) {
            if (ifname == this.mac_addr_table[i][0] && to == this.mac_addr_table[i][1])
                this.mac_addr_table.splice(i, 1)
        }
    }
}

var NETMASK = {
    0: '0.0.0.0',
    1: '128.0.0.0',
    2: '192.0.0.0',
    3: '224.0.0.0',
    4: '240.0.0.0',
    5: '248.0.0.0',
    6: '252.0.0.0',
    7: '254.0.0.0',
    8: '255.0.0.0',
    9: '255.128.0',
    10: '255.192.0.0',
    11: '255.224.0.0',
    12: '255.240.0.0',
    13: '255.248.0.0',
    14: '255.252.0.0',
    15: '255.254.0.0',
    16: '255.255.0.0',
    17: '255.255.128.0',
    18: '255.255.192.0',
    19: '255.255.224.0',
    20: '255.255.240.0',
    21: '255.255.248.0',
    22: '255.255.252.0',
    23: '255.255.254.0',
    24: '255.255.255.0',
    25: '255.255.255.128',
    26: '255.255.255.192',
    27: '255.255.255.224',
    28: '255.255.255.240',
    29: '255.255.255.248',
    30: '255.255.255.252',
    31: '255.255.255.254',
    32: '255.255.255.255'
}

function IPv4(ip) {
    this.setAddress(ip)
}
IPv4.prototype = {
    setAddress : function(ip) {
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
    },
    
    getAddress : function() {
        return this.octet[0] + '.' + this.octet[1] + '.' + this.octet[2] + '.' + this.octet[3]
    },
    
    uint : function () {
        return ((this.octet[0] << 24) + (this.octet[1] << 16) + (this.octet[2] << 8) + this.octet[3]) >>> 0
    },
    
    getNetworkAddress : function(mask) {
        if (!(mask instanceof IPv4)) throw new Error('bad type')
        var ip = this.uint()
        var maskbit = mask.uint()
        return new IPv4(ip & maskbit)
    },
    getBroadcastAddress : function(mask) {
        if (!(mask instanceof IPv4)) throw new Error('bad type')
        var ip = this.uint()
        var maskbit = mask.uint()
        return new IPv4((ip & maskbit) + (~maskbit))
    },

    equals : function(to) {
        return (this.uint() == to.uint())
    }
}

function Route(address, netmask, gateway, priority, accept = true) {
    (function checkType() {
        if ((!(address instanceof IPv4) && !(typeof address === 'string'))) throw new Error('bad type')
        if (netmask == null) throw new Error('bad type')
        if ((!(gateway instanceof IPv4) && !(typeof gateway === 'string'))) throw new Error('bad type')
        if (typeof priority !== 'number') throw new Error('bad type')
        if (typeof accept !== 'boolean') throw new Error('bad type')
    })()
    
    this.address = new IPv4(address)
    this.netmask = new IPv4(netmask)
    this.setGateway(gateway)
    this.setAccept(accept)
    this.priority = priority
}
Route.prototype = {
    setGateway : function(gw) {
        if (gw instanceof IPv4 || gw.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/))
            this.gateway = new IPv4(gw)
        else if (typeof gw === 'string')
            this.gateway = gw
    },
    
    getGateway : function() {
        return this.gateway
    },
    
    setAccept : function(accept) {
        this.accept = accept
    },
    
    getAccept : function() {
        return this.accept
    },
    
}

function Layer3Device(name, interfaces, ip, routes, description) {
    (function checkType() {
        if (typeof name !== 'string')
            throw new Errr('bad type: ' + typeof name)
            
        if (typeof interfaces === 'array')
            interfaces.forEach(function(i) {
                if (!(i instanceof Interface))
                    throw new Error('bad type')
            })
        
        
        if (typeof routes === 'array') {
            routes.forEach(function(r) {
                if (!(r instanceof Route))
                    throw new Error('bad type: ' + typeof Route)
            })
        }
        
    })()
    
    this.setName(name)
    this.setDescription(description)
    this.setRoutes(routes)
    this.setInterfaces(interfaces)
    
    var device = this
    this.getInterfaces().forEach(function(i) {
        i.device = device
    })
    
    this.ipv4 = {}
    if (interfaces.length != ip.length) throw new Error('invalid interface settings')
    for(var i = 0; i < this.interfaces[i]; i++) {
        this.ip[this.interfaces[i].name] = { 'ipaddr' : ip[i]['ipaddr'], 'netmask' : ip[i]['netmask'] }
    }
    this.arp = {}
}
Layer3Device.prototype = {
    setName : function(name) {
        this.name = name || ""
    },
    
    getName : function() {
        return this.name
    },
    
    setDescription : function(desc) {
        this.description = desc || ""
    },
    
    getDescription : function() {
        return this.description
    },

    setRoutes : function(routes) {
        this.routes = routes
    },
    
    getRoutes : function() {
        return this.routes
    },

    setInterfaces : function(interfaces) {
        this.interfaces = interfaces
        this.addDirectConnectionRoute(interfaces)
    },
    
    getInterfaces : function() {
        return this.interfaces
    },
    
    getInterface : function(ifname) {
        if (ifname == 0) return this.interfaces[0]
        if (typeof ifname !== 'string') return null
        for (var i in this.interfaces) {
            if (this.interfaces[i].getName() == ifname) {
                return this.interfaces[i]
            }
        }
        return null
    },

    addRoute : function(route) {
        this.routes.add(route)
    },
    
    deleteRoute : function(route) {
        this.routes.delete(route)
    },
    
    addDirectConnectionRoute : function(interfaces) {
        var routes = this.routes
        interfaces.forEach(function(value) {
            if (routes == undefined) { routes == [] }
            routes.push(new Route(value.getIPv4(), value.getNetmask(), value.getName(), 0))
        })
    },
    
    connect : function(ifname, to) {
        if (!(to instanceof Interface)) throw new Error('bad connect')
        this.getInterface(ifname).connect(to)
    },

    disconnect : function(ifname, from) {
        if (!(from instanceof Interface)) throw new Error('bad connect')
        this.getInterface(ifname).disconnect(from)
    },
    
    getConnection : function(ifname) {
        return this.getInterface(ifname).getConnection()
    },
    
    selectRoute : function(destIPaddr) {
        for (var i in this.routes) {
            var route = this.routes[i]
            if ((destIPaddr.uint() & route.netmask.uint()) == (route.address.uint() & route.netmask.uint())) {
                return route
            }
        }
        // Could't find an available route
        return null
    },
    
    sendARPRequest : function($destIP) {
        for (var i = 0; i < this.interfaces; i++) {
            var arpRequest = {
                'frame' : {
                    'sourceIPAddress' : this.interfaces[i].getIPv4(),
                    
                    'destinationIPAddress' : $destIP,
                    'destinationMACAddress' : 'ff-ff-ff-ff-ff-ff',
                    'type' : 'arp'
                }
            }
            send(this.interfaces[i], arpRequest)
        }
    },
    
    sendICMP : function(type, code, $destIP) {
        var icmp = {
            'packet' : {
                'protocol': 1, // icmp
                'type' : type,
                'code' : code,
                'sourceIPAddress' : this.interfaces[0].getIPv4(),
                'destinationIPAddress' : $destIP,
                'option' : null
            }
        }
        send(this.interfaces[0], icmp)
    },
    
    
    send : function($if, data) {
        data.frame = {
            'sourceMACAddress' : $if.mac,
           
        }
        
        var conn = this.getInterface(0).getConnection()
        if (conn == null) {
            console.log('Not connected.')
            return null
        }
        conn.transfer($if, data)
    },
    
    receive : function(frame) {
        
        // L2
        
        // L3
        
        // データ到達
        for (var i = 0; i < this.interfaces; i++) {
            if (this.interfaces[i].getAddress().equals(new IPv4(frame.destinationIPAddress)) {
                console.log(JSON.stringify(frame))
                return
            }
        }
        
        // フォワーディング
        var route = this.selectRoute(new IPv4(frame.destinationIPAddress))
        if (route == null) {
            // フレーム破棄
            return
        }
        
        if (route.getGateway() instanceof 'IPv4') {
            // next hop == ip address
            
            this.sendARPRequest(
        }
        else if (typeof route.getGateway() === 'string') {
            // next hop == interface
        }
        console.log(JSON.stringify(frame))
    }
}

function Connection() {
    this.connected = []
}
Connection.prototype = {
    connect : function($interface) {
        if (this.connected.length > 2) throw new Error("too many connection")
        this.connected.push($interface)
    },
    
    disconnect : function($interface) {
        for (var i in this.connected) {
            if (this.connected[i] === $interface) {
                this.connected.splice(i, 1)
            }
        }
    },
    
    connected : function() {
        return this.connected
    },
    
    transfer : function(src, data) {
        try {
            var dest = (src == this.connected[0]) ? this.connected[1] : this.connected[0]
            dest.device.receive(data)
        }
        catch (e) {
            throw new Error('connection not established')
        }
    }
}
