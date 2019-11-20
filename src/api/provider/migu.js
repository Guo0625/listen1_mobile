/* eslint no-bitwise: ["error", { "allow": ["&"] }] */
import queryString from 'query-string';
import { weapi } from '../../modules/crypto';

function requestAPI(url, data) {
  console.log('咪咕音乐 requestAPI');
  return fetch(url, {
    method: 'POST',
    headers: {
      referer: 'http://www.migu.cn',
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent':
        'Mozilla/5.0 (Linux; U; Android 8.1.0; zh-cn; BLA-AL00 Build/HUAWEIBLA-AL00) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/57.0.2987.132 MQQBrowser/8.9 Mobile Safari/537.36',
    },
    body: queryString.stringify(data),
  })
    .then(response => {
      return response.json();
    })
    .catch(() => {
      console.error(error);
    });
}
function getSmallImageUrl(url) {
  return `${url}`;
}
function showPlaylist(offset) {
  console.log('咪咕音乐 showPlaylist');
  const query = {
    offset,
  };
  const data = {
    cat: query.cat || '全部',
    order: query.order || 'hot', // hot,new
    limit: query.limit || 30,
    offset: query.offset || 0,
    total: true,
  };

  const url = 'https://music.163.com/weapi/playlist/list';

  return requestAPI(url, data)
    .then(r => {
      const playlists = r.playlists.map(item => ({
        cover_img_url: getSmallImageUrl(item.coverImgUrl),
        title: item.name,
        id: `neplaylist_${item.id}`,
        source_url: `http://music.163.com/#/playlist?id=${item.id}`,
      }));

      return { result: playlists };
    })
    .catch(() => {
      console.error(error);
    });
}
function getNEScore(song) {
  console.log('咪咕音乐 getNEScore');
  if (!song) return 0;
  const privilege = song.privilege;

  if (song.program) return 0;

  if (privilege) {
    if (privilege.st != null && privilege.st < 0) {
      return 100;
    }
    if (
      privilege.fee > 0 &&
      privilege.fee !== 8 &&
      privilege.payed === 0 &&
      privilege.pl <= 0
    ) return 10;
    if (privilege.fee === 16 || (privilege.fee === 4 && privilege.flag & 2048)) return 11;
    if (
      (privilege.fee === 0 || privilege.payed) &&
      privilege.pl > 0 &&
      privilege.dl === 0
    ) return 1e3;
    if (privilege.pl === 0 && privilege.dl === 0) return 100;

    return 0;
  }

  if (song.status >= 0) return 0;
  if (song.fee > 0) return 10;

  return 100;
}

function isPlayable(song) {
  return getNEScore(song) < 100;
}

function convert(allowAll) {
  return songInfo => ({
    id: songInfo.contentId,
    title: songInfo.name,
    artist: songInfo.singers.name,
    artist_id: songInfo.albums.id,
    album: songInfo.albums.name,
    album_id: songInfo.albums.id,
    source: 'migu',

    resourceType: songInfo.rateFormats.resourceType,
    toneFlag: songInfo.rateFormats.formatType,
    netType: `0`,
    userId: `15548614588710179085069`,
    ua: `Android_migu`,
    version: `5.1`,
    copyrightId: `0`,
    contentId: songInfo.contentId,
    channel: `1`,
    source_url: 'https://music.163.com/#/song?id=92783', //`http://app.pd.nf.migu.cn/MIGUM2.0/v1.0/content/sub/listenSong.do?toneFlag=${songInfo.rateFormats[0].formatType}&netType=00&&userId=15548614588710179085069&ua=Android_migu&version=5.1&copyrightId=0&contentId=${songInfo.contentId}&resourceType=${songInfo.rateFormats[0].resourceType}&channel=1`,
    img_url: songInfo.imgItems.img,
    url: `mgtrack_${songInfo.contentId}`, //songInfo.contentId,
    disabled: false,
  });
}

function getPlaylist(playlistId) {
  console.log('咪咕音乐 getPlaylist');
  const listId = playlistId.split('_').pop();
  const data = {
    id: listId,
    offset: 0,
    total: true,
    limit: 1000,
    n: 1000,
    csrf_token: '',
  };

  const url = 'http://music.163.com/weapi/v3/playlist/detail';

  return requestAPI(url, data).then(resData => {
    const info = {
      id: `neplaylist_${listId}`,
      cover_img_url: getSmallImageUrl(resData.playlist.coverImgUrl),
      title: resData.playlist.name,
      source_url: `http://music.163.com/#/playlist?id=${listId}`,
    };
    const tracks = resData.playlist.tracks.map(convert(true));

    return {
      info,
      tracks,
    };
  });
}

function bootstrapTrack(trackId) {
  console.log('咪咕音乐 bootstrapTrack', trackId);
  const songUrl =
    `http://app.pd.nf.migu.cn/MIGUM2.0/v1.0/content/sub/listenSong.do?toneFlag=LQ&netType=00&&userId=15548614588710179085069&ua=Android_migu&version=5.1&copyrightId=0&contentId=${trackId}&resourceType=2&channel=1`;

  // const songId = trackId.slice('netrack_'.length);

  // const data = {
  //   ids: [songId],
  //   level: 'standard',
  //   encodeType: 'aac',
  //   csrf_token: '',
  // };

  // return requestAPI(url, data).then(resData => {
  //   const { url: songUrl } = resData.data[0];

  //   if (songUrl === null) {
  //     return '';
  //   }

  return songUrl;
  // });
}

function xmConvertSong(songInfo) {
  console.log('咪咕音乐 songInfo', songInfo.contentId);
  const track = {
    id: songInfo.contentId,
    title: songInfo.name,
    artist: songInfo.singers[0].name,
    artist_id: songInfo.singers[0].id,
    album: '未知', //songInfo.singers[0].name,
    album_id: 'migu', //songInfo.singers[0].id,
    source: 'migu',
    source_url: 'https://music.163.com/#/song?id=92783', //`http://app.pd.nf.migu.cn/MIGUM2.0/v1.0/content/sub/listenSong.do?toneFlag=${songInfo.rateFormats[0].formatType}&netType=00&&userId=15548614588710179085069&ua=Android_migu&version=5.1&copyrightId=0&contentId=${songInfo.contentId}&resourceType=${songInfo.resourceType}&channel=1`,
    img_url: songInfo.imgItems[0].img,
    url: `mgtrack_${songInfo.contentId}`, //songInfo.id,
    lyric_url: `http://music.migu.cn/v3/api/music/audioPlayer/getLyric?copyrightId=${songInfo.copyrightId}`,
    disabled: false,
  };
  return track;
}


function search(keyword, page) {
  const url =
    `${'http://pd.musicapp.migu.cn/MIGUM2.0/v1.0/content/search_all.do?' +
    'ua=Android_migu&version=5.0.1' +
    '&pageNo='}${page}&pageSize=10` +
    `&text=${keyword}&searchSwitch={"song":1,"album":0,"singer":0,"tagSong":0,"mvSong":0,"songlist":0,"bestShow":1}`;
  return fetch(url)
    .then((res) => {
      return res.text()
    })
    .then((res) => {
      const text = res.slice(0);
      const jsonData = JSON.parse(text);
      const tracks = jsonData.songResultData.result.map(item =>
        xmConvertSong(item)
      );
      return { result: tracks, total: jsonData.songResultData.totalCount };
    });
}

function parseUrl(url) {
  console.log('咪咕音乐 parseUrl');

  let result = null;

  const r = /\/\/music\.163\.com\/playlist\/([0-9]+)/g.exec(url);

  if (r !== null) {
    return {
      type: 'playlist',
      id: `neplaylist_${r[1]}`,
    };
  }

  if (
    url.search('//music.163.com/#/m/playlist') !== -1 ||
    url.search('//music.163.com/#/playlist') !== -1 ||
    url.search('//music.163.com/playlist') !== -1 ||
    url.search('//music.163.com/#/my/m/music/playlist') !== -1
  ) {
    const parsed = queryString.parseUrl(url);

    result = {
      type: 'playlist',
      id: `neplaylist_${parsed.query.id} `,
    };
  }

  return result;
}

const meta = { name: '咪咕', platformId: 'mg', enName: 'migu' };

export default {
  meta,
  showPlaylist,
  getPlaylist,
  bootstrapTrack,
  search,
  parseUrl,
};
