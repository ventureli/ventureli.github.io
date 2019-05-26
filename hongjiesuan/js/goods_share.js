var app = new Vue({
  el: '#app',
  data: {
    baseUrl: 'http://ventureli.info/php/getpdddata.php?url=',
    requestUrl: 'http://gw-api.pinduoduo.com/api/router',
    client_secret: 'a7db2ecc1911f672d42d341618b0dbf1f21c2c51',
    goodsId: getUrlParam('goods_id'),
    goodsItem: '',
    items: [],
    page: 1,
    loading: false,
    noData: false,
    showMaskTip: false
  },
  created: function () {
    //
  },
  mounted: function () {
    this.getHeadData();
    this.getData();
  },
  methods: {
    // 获取头部数据
    getHeadData: function () {
      var me = this;
      var data = {
        goods_id_list: '['+ this.goodsId +']',
        type: 'pdd.ddk.goods.detail',
        data_type: 'JSON',
        client_id: 'cf798242cdf84a38b0959a4b509dfd22',
        timestamp: Math.floor(+new Date() / 1000)
      };
      var newData = objKeySort(data);
      var dataStr = '';
      var val = '';
      for (var i in newData) {
        if (Array.isArray(newData[i])) {
          val = newData[i].join(',');
        } else {
          val = newData[i];
        }
        dataStr += i + val;
      }
      data.sign = md5(this.client_secret + dataStr + this.client_secret).toUpperCase();
      // console.log(this.client_secret + dataStr + this.client_secret);
      // console.log(data);

      axios.post(me.requestUrl, data)
        .then(function (res) {
          var detail = res.data.goods_detail_response.goods_details[0];
          if (detail) {
            if (detail.has_coupon) {
              detail.coupon_start_time_format = moment(detail.coupon_start_time * 1000).format('YYYY.MM.DD');
              detail.coupon_end_time_format = moment(detail.coupon_end_time * 1000).format('YYYY.MM.DD');
            } else {
              detail.coupon_discount = 1;
            }
            
            me.goodsItem = detail;
          }
        })
        .catch(function (err) {
          console.error(err);
        })
    },
    // 获取列表数据
    getData: function() {
      var me = this;
      if (me.loading || me.noData) {
        return;
      }
      me.loading = true;
      var data = {
        opt_id: -1,
        with_coupon: true,
        sort_type: 0,
        type: 'pdd.ddk.goods.search',
        client_id: 'cf798242cdf84a38b0959a4b509dfd22',
        timestamp: Math.floor(+new Date() / 1000)
      };
      var newData = objKeySort(data);
      var dataStr = '';
      for (var i in newData) {
        dataStr += i + newData[i];
      }

      data.sign = md5(this.client_secret + dataStr + this.client_secret).toUpperCase();
      
      axios.post(me.requestUrl, data)
        .then(function (res) {
          var items = res.data.goods_search_response.goods_list;
          
          me.items = items;
          me.loading = false;
          me.noData = true;
          
        })
        .catch(function (err) {
          me.loading = false;
          console.error(err);
        })
    },

    download: function () {
      if (browser.versions.android) {
        if (browser.versions.weixin) {
          this.showMaskTip = true;
        } else {
          window.location.href = 'http://www.ventureli.info/pdd/pyyhh-release.apk';
        }
      } else if (browser.versions.ios) {
        window.location.href = 'https://itunes.apple.com/cn/app/id1410828750';
      }
    }
  }
})
