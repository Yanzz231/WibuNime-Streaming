function _0x3b52(){const _0xb16ed1=['upAnime2','getAnime1','each','push','Tanggal\x20Rilis:\x20','search','Rating\x20','#embed_holder\x20>\x20.player-embed\x20>\x20.responsive-embed-stream\x20>\x20iframe','#embed_holder\x20#pembed\x20>\x20iframe','1390zwuLEw','.fotoanime\x20>\x20.infozin\x20>\x20div\x20>\x20p:nth-child(3)\x20>\x20span','171382qXRVnJ','2040VKyIIx','.episodelist','1300jsJXwn','text','Status:\x20','1oPhoNq','src','get','Genre:\x20','.fotoanime\x20>\x20.infozin\x20>\x20div\x20>\x20p:nth-child(6)\x20>\x20span','replace','1244IuiXFT','data','loopEpp1','.single-info.bixbox\x20>\x20.info-content\x20>\x20.spe\x20>\x20span\x20>\x20a','https://anoboy.online/episode/','.fotoanime\x20>\x20.infozin\x20>\x20div\x20>\x20p:nth-child(11)\x20>\x20span','16NdIQVX','.bixbox.synp\x20>\x20.entry-content','axios','length','exports','href','89031WVaShx','load','11511caIQJg','getAnime2','log','loopEpp2','.single-info.bixbox\x20>\x20.infox\x20>\x20.rating\x20>\x20strong','.bigcontent\x20>\x20.infox\x20>\x20h1','a\x20>\x20div.epl-num','.fotoanime\x20>\x20img','trim','find','ul\x20>\x20li','a\x20>\x20div.epl-title','includes','470729dGYTWB','493782YTwFjW','/batch/','attr','Skor:\x20','action','.fotoanime\x20>\x20.infozin\x20>\x20div\x20>\x20p:nth-child(1)\x20>\x20span','22473hBUblk','Episode'];_0x3b52=function(){return _0xb16ed1;};return _0x3b52();}const _0x22f6da=_0x347a;(function(_0x161dc0,_0x4e9753){const _0x225d1a=_0x347a,_0x4d46aa=_0x161dc0();while(!![]){try{const _0x1d9137=-parseInt(_0x225d1a(0xe2))/0x1*(parseInt(_0x225d1a(0xdc))/0x2)+-parseInt(_0x225d1a(0xf4))/0x3+parseInt(_0x225d1a(0xe8))/0x4*(-parseInt(_0x225d1a(0xdf))/0x5)+-parseInt(_0x225d1a(0x104))/0x6+parseInt(_0x225d1a(0x103))/0x7*(-parseInt(_0x225d1a(0xee))/0x8)+-parseInt(_0x225d1a(0xf6))/0x9*(-parseInt(_0x225d1a(0xda))/0xa)+parseInt(_0x225d1a(0xcf))/0xb*(parseInt(_0x225d1a(0xdd))/0xc);if(_0x1d9137===_0x4e9753)break;else _0x4d46aa['push'](_0x4d46aa['shift']());}catch(_0x4d0e3e){_0x4d46aa['push'](_0x4d46aa['shift']());}}}(_0x3b52,0x1b5c8));const axios=require(_0x22f6da(0xf0)),cheerio=require('cheerio'),toNum=_0x4d7f7a=>{const _0x1ce11e=_0x22f6da;let _0x3944db=_0x4d7f7a[_0x1ce11e(0xd6)](_0x1ce11e(0xd0));if(_0x3944db===-0x1){let _0x53ebcf=_0x4d7f7a[_0x1ce11e(0xd6)]('OVA');return'OVA';}else{let _0x2dc773=_0x4d7f7a['slice'](_0x3944db),_0x9b213e=_0x2dc773[_0x1ce11e(0xe7)](/^\D+/g,''),_0x1a9457=_0x9b213e['match'](/\d+/);return parseInt(_0x1a9457);}};async function getAnime1(_0x2f30ee){const _0x468f63=_0x22f6da;try{const _0x42b27e=await axios['get'](_0x2f30ee),_0x5e505d=cheerio[_0x468f63(0xf5)](_0x42b27e['data']);let _0x3780e5=[],_0x3a781f=_0x5e505d(_0x468f63(0xce))[_0x468f63(0xe0)]()[_0x468f63(0xfe)]()['replace']('Judul:\x20',''),_0x2c363a=_0x5e505d(_0x468f63(0xfd))[_0x468f63(0x106)](_0x468f63(0xe3)),_0x1f7756=_0x5e505d('.sinopc')['text']()[_0x468f63(0xfe)](),_0x27a1d0=_0x5e505d(_0x468f63(0xe6))[_0x468f63(0xe0)]()[_0x468f63(0xfe)]()[_0x468f63(0xe7)](_0x468f63(0xe1),''),_0xaf0712=_0x5e505d(_0x468f63(0xed))[_0x468f63(0xe0)]()[_0x468f63(0xfe)]()['replace'](_0x468f63(0xe5),''),_0x37271c=_0x5e505d('.fotoanime\x20>\x20.infozin\x20>\x20div\x20>\x20p:nth-child(9)\x20>\x20span')[_0x468f63(0xe0)]()['trim']()[_0x468f63(0xe7)](_0x468f63(0xd5),''),_0x47a57b=_0x5e505d(_0x468f63(0xdb))['text']()[_0x468f63(0xfe)]()[_0x468f63(0xe7)](_0x468f63(0x107),'');const _0x12d240={'judul':_0x3a781f,'thumb':_0x2c363a,'sinop':_0x1f7756,'type':'TV','status':_0x27a1d0,'genre':_0xaf0712,'rilis':_0x37271c,'rating':_0x47a57b[_0x468f63(0xf1)]<0x1||isNaN(_0x47a57b)?'-':_0x47a57b};return _0x3780e5[_0x468f63(0xd4)](_0x12d240),_0x3780e5[0x0];}catch(_0x4dba27){return console[_0x468f63(0xf8)](_0x4dba27),![];}}async function loopEpp1(_0x2afe01){const _0x5b41f3=_0x22f6da;try{const _0x1864fd=await axios[_0x5b41f3(0xe4)](_0x2afe01),_0x5901e8=cheerio[_0x5b41f3(0xf5)](_0x1864fd['data']);let _0x1961c6=[];return _0x5901e8(_0x5b41f3(0xde))['each'](function(_0x5ed59c,_0x306565){const _0x36b7ce=_0x5b41f3;_0x5901e8(_0x306565)[_0x36b7ce(0xff)]('ul\x20>\x20li\x20>\x20span')['each'](function(_0x4eb9b5,_0x3ee301){const _0x171081=_0x36b7ce;let _0x359a59=_0x5901e8(_0x3ee301)[_0x171081(0xff)]('a')[_0x171081(0x106)](_0x171081(0xf3)),_0x2352c6=_0x5901e8(_0x3ee301)[_0x171081(0xff)]('a')[_0x171081(0xe0)]()[_0x171081(0xfe)]();if(_0x359a59==undefined||_0x359a59[_0x171081(0x102)](_0x171081(0x105)))return;const _0x248dad={'eps':toNum(_0x2352c6),'link':_0x359a59,'title':_0x2352c6};_0x1961c6['push'](_0x248dad);});}),_0x1961c6;}catch(_0x45a09f){return console[_0x5b41f3(0xf8)](_0x45a09f),![];}}async function upAnime1(_0x45df81){const _0x51806f=_0x22f6da;try{const _0x44dd0a=await axios[_0x51806f(0xe4)](_0x45df81),_0x22bd02=cheerio[_0x51806f(0xf5)](_0x44dd0a['data']);let _0x3445da=[],_0x273f95=_0x22bd02(_0x51806f(0xd8))[_0x51806f(0x106)](_0x51806f(0xe3));const _0x342d5f={'stream':_0x273f95};return _0x3445da[_0x51806f(0xd4)](_0x342d5f),_0x342d5f;}catch(_0x18d082){return console['log'](_0x18d082),![];}}async function getAnime2(_0x59a8eb){const _0x505d09=_0x22f6da;try{const _0x8808d0=await axios[_0x505d09(0xe4)](_0x59a8eb),_0x305e28=await axios[_0x505d09(0xe4)](_0x505d09(0xec)+_0x59a8eb['replace']('https://anoboy.online/anime/','')+'-episode-001');console[_0x505d09(0xf8)](_0x505d09(0xec)+_0x59a8eb[_0x505d09(0xe7)]('https://anoboy.online/anime/','')+'-episode-001');const _0x2b7ac9=cheerio['load'](_0x8808d0[_0x505d09(0xe9)]),_0x134a64=cheerio['load'](_0x305e28[_0x505d09(0xe9)]);let _0x32d491=[],_0x19ae94=_0x2b7ac9(_0x505d09(0xfb))[_0x505d09(0xe0)]()[_0x505d09(0xfe)](),_0x26585a=_0x2b7ac9(_0x505d09(0xef))[_0x505d09(0xe0)]()[_0x505d09(0xfe)](),_0x54fc6b=_0x134a64(_0x505d09(0xeb))['text']()[_0x505d09(0xfe)](),_0x3e044a=_0x134a64(_0x505d09(0xfa))[_0x505d09(0xe0)]()[_0x505d09(0xfe)]()[_0x505d09(0xe7)](_0x505d09(0xd7),''),_0x342a4e=_0x2b7ac9('.bigcontent\x20>\x20.thumbook\x20>\x20.thumb\x20>\x20img')[_0x505d09(0x106)](_0x505d09(0xe3));const _0x1471bc={'judul':_0x19ae94,'thumb':_0x342a4e,'sinop':_0x26585a,'type':'TV','status':_0x54fc6b=='Ended'?!![]:![],'genre':_0x505d09(0xcd),'rilis':'-','rating':_0x3e044a['length']<0x1||isNaN(_0x3e044a)?'-':_0x3e044a};return _0x32d491[_0x505d09(0xd4)](_0x1471bc),_0x32d491[0x0];}catch(_0xf2a02a){return console[_0x505d09(0xf8)](_0xf2a02a),![];}}async function loopEpp2(_0x333181){const _0x48236c=_0x22f6da;try{const _0x2f0bd3=await axios[_0x48236c(0xe4)](_0x333181),_0xdacafe=cheerio[_0x48236c(0xf5)](_0x2f0bd3[_0x48236c(0xe9)]);let _0x378a1b=[];return _0xdacafe('.eplister')[_0x48236c(0xd3)](function(_0x57e16c,_0x2dc1ae){const _0x241c70=_0x48236c;_0xdacafe(_0x2dc1ae)['find'](_0x241c70(0x100))[_0x241c70(0xd3)](function(_0x293e9c,_0x1de0de){const _0xee25dd=_0x241c70;let _0x23a3ae=_0xdacafe(_0x1de0de)[_0xee25dd(0xff)]('a')[_0xee25dd(0x106)](_0xee25dd(0xf3)),_0x2278ab=_0xdacafe(_0x1de0de)[_0xee25dd(0xff)](_0xee25dd(0x101))[_0xee25dd(0xe0)]()['trim'](),_0x38dc34=_0xdacafe(_0x1de0de)['find'](_0xee25dd(0xfc))['text']()[_0xee25dd(0xfe)]();if(_0x23a3ae==undefined||_0x23a3ae[_0xee25dd(0x102)]('batch'))return;const _0x4405b6={'eps':_0x38dc34,'link':_0x23a3ae,'title':_0x2278ab};_0x378a1b[_0xee25dd(0xd4)](_0x4405b6);});}),_0x378a1b;}catch(_0x470908){return console[_0x48236c(0xf8)](_0x470908),![];}}async function upAnime2(_0x3ef964){const _0x9f3761=_0x22f6da;try{const _0x14664c=await axios['get'](_0x3ef964),_0x305daf=cheerio[_0x9f3761(0xf5)](_0x14664c[_0x9f3761(0xe9)]);let _0x1324e9=[],_0x24c098=_0x305daf(_0x9f3761(0xd9))[_0x9f3761(0x106)](_0x9f3761(0xe3));const _0x2d11a0={'stream':_0x24c098,'download':_0x24c098[_0x9f3761(0x102)]('uservideo')?_0x24c098[_0x9f3761(0xe7)]('?embed=true',''):'-'};return _0x1324e9[_0x9f3761(0xd4)](_0x2d11a0),_0x2d11a0;}catch(_0x105f86){return console[_0x9f3761(0xf8)](_0x105f86),![];}}function _0x347a(_0x318cbe,_0x10a670){const _0x3b52a4=_0x3b52();return _0x347a=function(_0x347a3a,_0x19ff53){_0x347a3a=_0x347a3a-0xcd;let _0x34ec4e=_0x3b52a4[_0x347a3a];return _0x34ec4e;},_0x347a(_0x318cbe,_0x10a670);}module[_0x22f6da(0xf2)][_0x22f6da(0xd2)]=getAnime1,module[_0x22f6da(0xf2)]['upAnime1']=upAnime1,module[_0x22f6da(0xf2)][_0x22f6da(0xea)]=loopEpp1,module[_0x22f6da(0xf2)][_0x22f6da(0xf7)]=getAnime2,module[_0x22f6da(0xf2)][_0x22f6da(0xd1)]=upAnime2,module['exports'][_0x22f6da(0xf9)]=loopEpp2;