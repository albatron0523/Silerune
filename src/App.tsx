
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getDoc, setDoc } from 'firebase/firestore';
import { docRef } from './firebase';

const isValidDateStr = (str: string) => {
  if (!/^\d{4}\/\d{2}\/\d{2}$/.test(str)) return false;
  const parts = str.split('/');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  const dateObj = new Date(y, m - 1, d);
  return !isNaN(dateObj.getTime()) && dateObj.getFullYear() === y && dateObj.getMonth() === m - 1 && dateObj.getDate() === d;
};

const resolveImageUrl = (input: string): string => {
  if (!input) return "";
  const trimmed = input.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  return `https://raw.githubusercontent.com/albatron0523/my-illustrations/main/${trimmed}`;
};

const renderSupplementContent = (content: string) => {
  if (!content) return "";
  // Convert *text* to <span class='highlight'>text</span>
  return content.replace(/\*(.*?)\*/g, "<span class='highlight'>$1</span>");
};

// --- Data ---
const TRIVIA_DATABASE = [
  "伊維爾因為有著嬌小的身軀又常穿著學生制服遊蕩，常被誤認成一年級新生。",
  "艾洛蒂有一位極其信任的執事，專門替她處理各類繁瑣的雜事。",
  "米蕾優是艾蕾諾菈唯一的「貼身」女僕，雖然府邸內還有多名普通女僕。",
  "艾蕾諾菈私下的愛好非常單純：看書與享用甜食。",
  "路西恩不喜歡運動類活動，更偏好演奏音樂等靜態活動。",
  "莉雪有一位弟弟，她從小就被賦予了「必須養成合格侯爵繼承人」的重責大任。",
  "在故事前期，艾蕾諾菈從未因傷心而哭泣，流過的眼淚僅是生理反射。",
  "驚人的事實：智商超群的艾蕾諾菈，其實是個徹底的路痴。",
  "卡修斯過去常以「確認人民生活狀況」為藉口，理直氣壯地翹掉禮儀課。",
  "路西恩始終戴著手套，其實是為了掩蓋雙手那不為人知的傷疤。",
  "鮮為人知的是，現任學院的行政處長奧斯丁其實曾是路西恩的禮儀老師。"
];

const OBSERVATION_DATABASE = [
  {
    id: 0,
    nameZh: "艾蕾諾菈·克雷瑟",
    nameEn: "Eleanora Cressel",
    colors: { P: "#817bb5", A: "#a29ed4", H: "#928dbf", Q: "#6e68a3", B: "#bdbade" },
    freshman: { quote: "「我就喜歡這樣的你。」", attr: "水", mana: "85%", stability: "81%", talent: "C", ability: "已開發 10%", beastSync: "龍 默契度 65%" },
    graduate: { quote: "「我並不特殊。」", attr: "全", mana: "95%", stability: "90%", talent: "C", ability: "已開發 35%", beastSync: "龍 默契度 92%" }
  },
  {
    id: 1,
    nameZh: "路西恩·法雷蒙",
    nameEn: "Lucien Valemont",
    colors: { P: "#b5a36b", A: "#ccbf93", H: "#c2b484", Q: "#9c8a55", B: "#d6d0b6" },
    freshman: { quote: "「 您是因為利益才拯救我的，不是嗎？ 」", attr: "光", mana: "46%", stability: "81%", talent: "S", ability: "已開發 35%", beastSync: "蝙蝠 默契度 77%" },
    graduate: { quote: "「 在愛上她的那刻，我早已做好赴死的覺悟。 」", attr: "光", mana: "57%", stability: "96%", talent: "S", ability: "已開發 90%", beastSync: "蝙蝠 默契度 94%" }
  },
  {
    id: 2,
    nameZh: "席恩·法雷蒙",
    nameEn: "Cian Valemont",
    colors: { P: "#6b7bb0", A: "#98a3cc", H: "#808cc2", Q: "#5a6a9c", B: "#bcc4e0" },
    freshman: { quote: "「 開什麼玩笑！明明我才是繼承人！」", attr: "水", mana: "42%", stability: "35%", talent: "B", ability: "已開發 40%", beastSync: "蛇 默契度 15%" },
    graduate: { quote: "「 啊啊，你也跟我一樣，對吧？」", attr: "水", mana: "50%", stability: "67%", talent: "B", ability: "已開發 97%", beastSync: "蛇 默契度 83%" }
  },
  {
    id: 3,
    nameZh: "莉雪·瑟蘭",
    nameEn: "Lys Seranne",
    colors: { P: "#6a948e", A: "#8eb5b0", H: "#7da6a0", Q: "#53857e", B: "#b2cfcb" },
    freshman: { quote: "「 我真的不配入你的眼嗎？」", attr: "風", mana: "67%", stability: "70%", talent: "A", ability: "已開發 20%", beastSync: "曜隼 默契度 63%" },
    graduate: { quote: "「 如果歷史從未發生，那就由我來創造。」", attr: "風", mana: "81%", stability: "79%", talent: "A", ability: "已開發 89%", beastSync: "曜隼 默契度 84%" }
  },
  {
    id: 4,
    nameZh: "艾洛蒂·拉維涅",
    nameEn: "Elody Ravigny",
    colors: { P: "#b08698", A: "#c7a3b2", H: "#bd97a7", Q: "#9c7083", B: "#d6c5cb" },
    freshman: { quote: "「來學校就是為了享受青春！對吧？」", attr: "風", mana: "74%", stability: "65%", talent: "B", ability: "已開發 15%", beastSync: "獨角獸 默契度 86%" },
    graduate: { quote: "「為什麼連努力也要攀比呢？你看，這雙手所長出的繭，是只有你有的，就像過程的痛與苦，只有你體驗過一樣。 」", attr: "風", mana: "79%", stability: "79%", talent: "B", ability: "已開發 76%", beastSync: "獨角獸 默契度 97%" }
  },
  {
    id: 5,
    nameZh: "卡修斯·賽西爾",
    nameEn: "Cassius Cecil",
    colors: { P: "#989c6d", A: "#b8bd96", H: "#abb088", Q: "#828757", B: "#cdcfb8" },
    freshman: { quote: "「 因為你是我未來的子民啊！」", attr: "火", mana: "85%", stability: "63%", talent: "S+", ability: "已開發 45%", beastSync: "鳳凰 默契度 64%" },
    graduate: { quote: "「 『愛』究竟是什麼……？」", attr: "火", mana: "90%", stability: "78%", talent: "S+", ability: "已開發 90%", beastSync: "鳳凰 默契度 82%" }
  },
  {
    id: 6,
    nameZh: "奧斯丁·費雪",
    nameEn: "Austin Fisher",
    colors: { P: "#b55d5d", A: "#d4a2a2", H: "#bf8d8d", Q: "#a36868", B: "#debdbd" },
    freshman: { quote: "「 聽好了，路西恩。雖然我們的生活環境告訴我們，這世界的惡意數不勝數，但純粹的善意依然存在。」", attr: "火", mana: "72%", stability: "86%", talent: "S+", ability: "已開發 90%", beastSync: "鳳凰 默契度 89%" },
    graduate: { quote: "「 聽好了，路西恩。雖然我們的生活環境告訴我們，這世界的惡意數不勝數，但純粹的善意依然存在。」", attr: "火", mana: "72%", stability: "86%", talent: "S+", ability: "已開發 90%", beastSync: "鳳凰 默契度 89%" },
    noToggle: true
  },
  {
    id: 7,
    nameZh: "伊維爾·艾凡",
    nameEn: "Yvel Evan",
    colors: { P: "#a19db8", A: "#c4c1d4", H: "#b3afc9", Q: "#7e7a96", B: "#e0deeb" },
    freshman: { 
      quote: "「你為什麼想來這所學校呢?」", 
      attr: "火", mana: "95%", stability: "94%", talent: "A", ability: "已開發70%", beastSync: "鳳凰 默契度60%" 
    },
    graduate: { 
      quote: "「永無止盡。」", 
      attr: "Ω / ALL", mana: "99.9% (OVERFLOW)", stability: "99.9% (OVERFLOW)", talent: "† GOD CHILD †", ability: "UNDEFINED", beastSync: "UNRECOGNIZABLE" 
    },
    isYvel: true
  }
];

const ART_METADATA: Record<string, { title: string; date: string; artist: string }> = {
  'FB_IMG_1749826495034.jpg': { title: '盛開的白玫瑰', date: '2025年6月13日', artist: '米果' },
  'FB_IMG_1751735099362.jpg': { title: '艾蕾諾菈Q版', date: '2025年7月4日', artist: '米果' },
  'FB_IMG_1769782908274.jpg': { title: '社交舞練習', date: '2025年12月21日', artist: '歪歪' },
  'IMG_5697.png': { title: '艾蕾諾菈滿版', date: '2025年7月4日', artist: '米果' },
  '無標題1016_20251216090827.png': { title: '蝴蝶', date: '2025年12月15日', artist: '青雲（作者）' },
  '無標題1016_20251216121552.png': { title: '蝴蝶', date: '2025年12月15日', artist: '青雲（作者）' },
  '無標題1033_20260101025628.png': { title: '耳畔的低語', date: '2025年12月31日', artist: '青雲（作者）' },
  '無標題1067_20260118005441.png': { title: '墜入海洋之眼', date: '2026年1月17日', artist: '青雲（作者）' },
  '無標題951_20260118020109.png': { title: '海洋之眼', date: '2026年1月17日', artist: '青雲（作者）' },
  '無標題1102_20260208235836.png': { title: '雙馬尾日', date: '2026年2月8日', artist: '青雲（作者）' },
  '無標題1102_20260208235846.png': { title: '雙馬尾日', date: '2026年2月8日', artist: '青雲（作者）' },
  '無標題1103_20260210015346.png': { title: '耳環', date: '2026年2月10日', artist: '卉' },
  '無標題1121_20260219211404.png': { title: '表情亂畫一通！', date: '2026年2月19日', artist: '青雲（作者）' },
  '無標題393_20251215195508.png': { title: '大頭', date: '2025年12月22日', artist: '空白' },
  '無標題397_20251222082314.png': { title: '大頭', date: '2025年12月22日', artist: '空白' },
  '無標題860_20250618164117.png': { title: '制止', date: '2025年5月31日', artist: '青雲（作者）' },
  '無標題878_20250614021733.png': { title: '艾蕾諾菈人設圖', date: '2025年6月13日', artist: '青雲（作者）' },
  '無標題878_20250708200831.png': { title: '艾蕾諾菈人設圖', date: '2025年6月13日', artist: '青雲（作者）' },
  '無標題887_20250622181052.png': { title: 'eyes', date: '2025年6月8日', artist: '青雲（作者）' },
  '無標題887_20250622210234.png': { title: 'eyes', date: '2025年6月22日', artist: '青雲（作者）' },
  '無標題933_20250810153340.png': { title: '大頭', date: '2025年8月10日', artist: '青雲（作者）' },
  '無標題933_20250811052051.png': { title: '大頭', date: '2025年8月11日', artist: '青雲（作者）' },
  '無標題1148.png': { title: '移不開的眼眸', date: '2026年4月1日', artist: '青雲（作者）' },
  '無標題1129_20260402112145.png': { title: '未回首的視線', date: '2026年3月18日', artist: '青雲（作者）' },
};

const getArtInfo = (url: string) => {
  const filename = decodeURIComponent(url.split('/').pop() || '');
  return ART_METADATA[filename] || { title: '未知作品', date: '未知', artist: '未知' };
};

const OceanEyesShowcase: React.FC<{ 
  isBackgroundPlaying: boolean, 
  setIsBackgroundPlaying: (val: boolean) => void, 
  isEditMode?: boolean, 
  onEdit?: () => void,
  videoListState: any[],
  activeVideoIndex: number,
  setActiveVideoIndex: (idx: number) => void
}> = ({ 
  isBackgroundPlaying, 
  setIsBackgroundPlaying, 
  isEditMode, 
  onEdit, 
  videoListState, 
  activeVideoIndex, 
  setActiveVideoIndex 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadProgress, setLoadProgress] = useState(0);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const wasPlayingBeforeRef = useRef(false);
  const isBackgroundPlayingRef = useRef(isBackgroundPlaying);

  const currentVideo = videoListState[activeVideoIndex] || videoListState[0];

  // Map to store preloaded blob URLs and progress per video ID
  const [cache, setCache] = useState<Record<string, { blobUrl: string; progress: number }>>({});

  // Prefetching effect
  useEffect(() => {
    let isMounted = true;
    const controllers: Record<string, AbortController> = {};

    const fetchVideoIntoCache = async (vid: any) => {
      if (!vid || !vid.videoUrl) return;
      
      // If already cached, don't fetch again
      if (cache[vid.id]?.progress === 100) {
        return;
      }

      const controller = new AbortController();
      controllers[vid.id] = controller;

      try {
        const response = await fetch(vid.videoUrl, { signal: controller.signal });
        if (!response.ok) throw new Error("Fetch failed");

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        let loaded = 0;

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        const chunks: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            loaded += value.length;
            if (total > 0 && isMounted) {
              const pct = (loaded / total) * 100;
              setCache(prev => ({
                ...prev,
                [vid.id]: { blobUrl: prev[vid.id]?.blobUrl || "", progress: pct }
              }));
            }
          }
        }

        if (isMounted) {
          const blob = new Blob(chunks, { type: 'video/mp4' });
          const url = URL.createObjectURL(blob);
          setCache(prev => ({
            ...prev,
            [vid.id]: { blobUrl: url, progress: 100 }
          }));
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError' && isMounted) {
          console.error(`Prefetch failed for ${vid.id}:`, err);
          setCache(prev => ({
            ...prev,
            [vid.id]: { blobUrl: vid.videoUrl, progress: 100 }
          }));
        }
      }
    };

    const startPrefetches = async () => {
      // 1. Fetch current active video
      await fetchVideoIntoCache(currentVideo);

      // 2. If current is ocean, fetch moon as well in the background
      if (currentVideo.id === 'ocean') {
        const moonVid = videoListState.find(v => v.id === 'moon');
        if (moonVid) {
          setTimeout(() => {
            fetchVideoIntoCache(moonVid);
          }, 1000);
        }
      }
    };

    startPrefetches();

    return () => {
      isMounted = false;
      Object.values(controllers).forEach(c => c.abort());
    };
  }, [currentVideo.id, videoListState]);

  // Handle active video sync from cache
  useEffect(() => {
    const currentCache = cache[currentVideo.id];
    if (currentCache && currentCache.progress === 100 && currentCache.blobUrl) {
      setVideoBlobUrl(currentCache.blobUrl);
      setLoadProgress(100);
      
      if (hasInitialized) {
        setIsReady(true);
        const timer = setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().catch(() => {});
          }
        }, 150);
        return () => clearTimeout(timer);
      } else {
        setIsReady(false);
      }
    } else {
      setVideoBlobUrl(null);
      setLoadProgress(currentCache?.progress || 0);
      setIsReady(false);
    }
  }, [currentVideo.id, cache[currentVideo.id]?.progress, cache[currentVideo.id]?.blobUrl, hasInitialized]);

  useEffect(() => {
    isBackgroundPlayingRef.current = isBackgroundPlaying;
  }, [isBackgroundPlaying]);

  const initShowcase = () => {
    setHasInitialized(true);
    setIsReady(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onPlay = () => {
      setIsPlaying(true);
      if (isBackgroundPlayingRef.current) {
        wasPlayingBeforeRef.current = true;
        setIsBackgroundPlaying(false);
      }
    };

    const onPause = () => {
      setIsPlaying(false);
      if (wasPlayingBeforeRef.current) {
        setIsBackgroundPlaying(true);
        wasPlayingBeforeRef.current = false;
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      if (wasPlayingBeforeRef.current) {
        setIsBackgroundPlaying(true);
        wasPlayingBeforeRef.current = false;
      }
      setTimeout(() => {
        const gallery = document.querySelector('.gallery-outer');
        if (gallery) {
          gallery.scrollIntoView({ behavior: 'smooth' });
        }
      }, 800);
    };

    const onProgress = () => {
      if (v.duration > 0 && v.buffered.length > 0) {
        const bufferedEnd = v.buffered.end(v.buffered.length - 1);
        const p = (bufferedEnd / v.duration) * 100;
        setLoadProgress(prev => Math.max(prev, p));
      }
    };

    const onTimeUpdate = () => {
      setProgress((v.currentTime / v.duration) * 100);
      
      const lines = document.querySelectorAll('.lyric-line');
      const lyricList = document.getElementById('lyricList-pv');
      if (!lyricList) return;

      let activeLine: HTMLElement | null = null;
      lines.forEach((line, i) => {
        const time = parseFloat((line as HTMLElement).dataset.time || '0');
        const nextLine = lines[i+1] as HTMLElement;
        const nextTime = nextLine ? parseFloat(nextLine.dataset.time || '999') : 999;
        
        if (v.currentTime >= time && v.currentTime < nextTime) {
          line.classList.add('active');
          activeLine = line as HTMLElement;
        } else {
          line.classList.remove('active');
        }
      });

      if (activeLine) {
        const lineOffset = activeLine.offsetTop;
        lyricList.style.transform = `translateY(-${lineOffset}px)`;
      }
    };

    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('ended', onEnded);
    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('progress', onProgress);
    v.addEventListener('loadedmetadata', onProgress);

    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('ended', onEnded);
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('progress', onProgress);
      v.removeEventListener('loadedmetadata', onProgress);
      if (wasPlayingBeforeRef.current) {
        setIsBackgroundPlaying(true);
      }
    };
  }, [setIsBackgroundPlaying, videoBlobUrl]);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      videoRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * videoRef.current.duration;
    }
  };

  const handlePrevVideo = () => {
    const nextIdx = (activeVideoIndex - 1 + videoListState.length) % videoListState.length;
    setActiveVideoIndex(nextIdx);
  };

  const handleNextVideo = () => {
    const nextIdx = (activeVideoIndex + 1) % videoListState.length;
    setActiveVideoIndex(nextIdx);
  };

  return (
    <div className={`master-container-pv relative ${isReady ? 'playing-pv' : ''}`} id="main-pv">
      {isEditMode && (
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
          className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#bdbade] hover:bg-[#8a7f9c] flex items-center justify-center text-white text-[10px] font-bold shadow-sm z-[10000] transition-colors cursor-pointer"
        >
          ✎
        </button>
      )}
      {!isReady && (
        <div className="loading-overlay-pv" id="loader-pv">
          <button 
            className="enter-btn-pv" 
            onClick={initShowcase}
            disabled={loadProgress < 100}
          >
            {loadProgress < 100 ? `LOADING ${Math.round(loadProgress)}%` : "Start 播放"}
          </button>
          <div className="loading-bar-container-pv">
            <div className="loading-bar-fill-pv" style={{ width: `${loadProgress}%` }}></div>
          </div>
        </div>
      )}

      <div className="video-side-pv">
        <video ref={videoRef} id="v-pv" preload="auto" playsInline controls className={isReady ? 'ready' : ''} src={videoBlobUrl || undefined}>
        </video>
      </div>

      <div className="ui-side-pv">
        <div className="header-area-pv">
          <h1 className="title-pv">{currentVideo.title}</h1>
          <div className="controls-pv">
            <button className="ctrl-btn-pv" onClick={() => { if(videoRef.current) videoRef.current.currentTime -= 5 }}>⟲ 5s</button>
            <button className="ctrl-btn-pv" id="playBtn-pv" onClick={togglePlay}>{isPlaying ? '⏸' : '▶'}</button>
            <button className="ctrl-btn-pv" onClick={() => { if(videoRef.current) videoRef.current.currentTime += 5 }}>5s ⟳</button>
            <div className="seek-bar-pv" onClick={seek}><div className="seek-progress-pv" style={{ width: `${progress}%` }}></div></div>
          </div>
        </div>

        <div className="flex items-center justify-between w-full gap-2 mt-4 flex-grow overflow-hidden relative">
          <button 
            onClick={handlePrevVideo}
            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white text-[10px] font-bold transition-all cursor-pointer select-none"
            title="上一個影片"
          >
            ◁
          </button>

          <div className="lyrics-viewport-pv flex-grow min-h-[120px] relative overflow-hidden flex flex-col justify-center">
            {currentVideo.lyrics && currentVideo.lyrics.length > 0 ? (
              <div id="lyricList-pv" className="transition-transform duration-300">
                {currentVideo.lyrics.map((line: any, idx: number) => (
                  <div key={idx} className="lyric-line" data-time={line.time}>
                    <span className="translation">{line.trans}</span>
                    <span className="original">{line.orig}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-xs italic flex items-center justify-center h-full">
                (無字幕資料)
              </div>
            )}
          </div>

          <button 
            onClick={handleNextVideo}
            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white text-[10px] font-bold transition-all cursor-pointer select-none"
            title="下一個影片"
          >
            ▷
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Parsers for Chapter content formatting ---
const htmlToPlainText = (html: string): string => {
  if (!html) return "";
  let temp = html.trim();
  // Standardize br structures
  temp = temp.replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, "\n");
  temp = temp.replace(/<p>\s*<br\s*\/?>\s*<p>/gi, "\n");
  temp = temp.replace(/<p><br><p>/gi, "\n");
  
  const paragraphs: string[] = [];
  const regex = /<p>(.*?)<\/p>/gis;
  let match;
  
  while ((match = regex.exec(temp)) !== null) {
    const content = match[1].trim();
    if (content === "<br>" || content === "") {
      paragraphs.push("");
    } else {
      paragraphs.push(content);
    }
  }
  
  if (paragraphs.length === 0) {
    return temp;
  }
  
  return paragraphs.join("\n\n");
};

const plainTextToHtml = (text: string): string => {
  if (!text) return "";
  const lines = text.split(/\r?\n/);
  const paragraphs: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "") {
      paragraphs.push("<p><br></p>");
    } else {
      paragraphs.push(`<p>${line}</p>`);
    }
  }
  
  return paragraphs.join("\n");
};

// --- Components ---
const INITIAL_CHAPTERS = [
    {
      title: "序章",
      meta: "Recorded in Kleiser Estate",
      content: `
        <p>克雷瑟家的餐廳裡，女僕與執事們安靜地站在邊上，長桌上已擺滿各式料理，香氣四溢，只等家中的主人們享用。</p>
        <p><br><p>
        <p>此時淺紫髮的少女走進餐廳，長而濃密的睫毛與白皙的皮膚就如同精緻的人偶活過來一般，她用與胸前湛藍色寶石同色的眼眸看向一旁正在閒聊的父親與白髮少年。</p>
        <p>「艾蕾諾菈，妳來了啊。」克雷瑟公爵勾手示意她靠近，等少女移動到二人面前時，他便搭著少年的肩向少女介紹：「這是我之前跟妳說過的路西恩·法雷蒙——妳的未婚夫。」</p>
        <p>「初次見面，克雷瑟小姐，我是路西恩·法雷蒙。」少年笑著向少女敬禮。</p>
        <p>「……初次見面。」艾蕾諾菈也微微頷首，禮貌地拉起裙擺回應。</p>
        <p>看著二人和諧的樣子，公爵滿意地笑了笑「既然都打完招呼了，我們就上桌吃飯吧。」</p>
        <p>「好的。」路西恩笑著回應，而艾蕾諾菈輕輕點了點頭後便朝自己的座位走去。</p>
        <p><br><p>
        <p>餐具輕碰瓷器的聲音此起彼伏，公爵看著兩位孩子都沒有要開口的想法，於是率先開啟了話題：「艾蕾諾菈，你還記得我們一年前觀賞的音樂會嗎？路西恩就是壓軸演奏小提琴的那位少年喔，我記得你那時有特別誇他的演奏好聽。」公爵笑著看向自己的女兒，艾蕾諾菈停下了進食的動作，抬頭看向坐在對面的路西恩。</p>
        <p>「這是真的嗎？能獲得克雷瑟小姐的讚美我非常榮幸。」路西恩笑著看向艾蕾諾菈，潔白的眼睫毛讓他帥氣的臉龐更為閃耀，如果是一般的大小姐看見如此帥氣的少年對自己笑，早就墜入愛河，但艾蕾諾菈只是輕輕點了點頭，隨後又低頭繼續專注用餐。</p>
        <p>「抱歉啊，路西恩。艾蕾諾菈總是這樣，之後可能要麻煩你辛苦一點了。」公爵笑著打圓場。</p>
        <p>「不會的，我覺得這樣的克雷瑟小姐很有特色，也剛好我比較擅長閒聊……只希望克雷瑟小姐不要嫌棄我就好。」</p>
        <p>「哈哈哈，她怎麼會嫌棄你呢？你可是人人稱羨的『法雷蒙少爺』啊！」</p>
        <p>「呵呵，您過獎了。」</p>
        <p><br><p>
        <p>回應完公爵的路西恩回頭繼續用餐，偶爾「不經意」抬頭看向眼前的少女。</p>
        <p>艾蕾諾菈感受得到金黃色瞳眸對自己的注視——不，是試探，而且是獵人盯上獵物才有的眼神，但她並不在意，只是不為所動繼續進食，連個眼神都沒給他。</p>
        <p>隨著路西恩一點一滴的觀察，他對「獵物」感到頗為滿意。</p>
        <p>用餐結束，他在無人注意的地方輕笑了一聲，隨後又換回乖巧且溫柔的神情。</p>
        <p><br><p>
        <p>等到月亮高掛天空之際，也是二人結束短暫的交流之時。</p>
        <p>「好了，艾蕾諾菈，跟路西恩說個再見。」</p>
        <p>「……再見。」</p>
        <p>「下次見，克雷瑟小姐。祝您今日——不，每日都有個好夢。」路西恩又對艾蕾諾菈笑了一下才轉身離去，公爵看著路西恩離去的背影，對身旁的女兒問了個問題：「你覺得路西恩怎麼樣？」</p>
        <p>艾蕾諾菈沒有開口，只是看著上了馬車的少年，點了點頭，以表達滿意。</p>
        <p>「這樣啊……那我就放心了。」看到女兒難得第一次見面就給出了肯定的答覆，公爵心情大好。</p>
        <p>月光灑落在馬車裡，路西恩低頭回想艾蕾諾菈的樣貌，不得不說……是真的美得動人。</p>
        <p>如果是吃虧了也不喊痛的人就更好了。</p>
        <p>路西恩想著，已經開始不知不覺期待下次見面。</p>
      `
    },
    {
      title: "第一章",
      meta: "Silerune // Library of Secrets",
      content: `
        <p>希鷺倫（Silerune）——在北方大陸的國家——與南方強國瓦爾托梅爾齊名，其境內礦產豐饒，產業蓬勃發展，其中多數資源掌控於克雷瑟公爵手中，也因此克雷瑟家族財力十分雄厚，家族地位僅次於皇帝。</p>
        <p>而克雷瑟家中僅育有一女——艾蕾諾菈·克雷瑟。</p>
        <p>據說長得如人偶般美麗，擁有與其母親一致的紫羅蘭秀髮，皮膚白皙、身材纖細，也如人偶般極少開口講話，光是坐在一邊就像一件藝術品，僅可遠觀而不可褻玩，但因她很少出門踏青，所以親眼目睹過她真容的人並不多。</p>
        <p><br><p>
        <p>「妳聽說了嗎？那位『法雷蒙少爺』竟然與克雷瑟公爵之女訂婚了！」</p>
        <p>「真的嗎？我原本還以為我有機會的說……不過也是，如果是克雷瑟公爵之女的話與他確實門當戶對。」</p>
        <p>貴族少女們悄悄討論著最新得知的消息，而話題的主角——路西恩·法雷蒙——正坐馬車緩緩駛入克雷瑟宅邸。</p>
        <p><br><p>
        <p>進入克雷瑟家中，路西恩熟捻地敲了敲休息室的門，隨後退一步，靜待女僕應聲。</p>
        <p>「歡迎您，法雷蒙少爺。」大門隨著女僕的話語敞開。</p>
        <p>映入眼簾的即是正安靜讀書的紫髮少女，微垂的眼眸顯得睫毛更為細長，襯著她小巧的面容，更添了幾分不染塵埃的精緻。</p>
        <p><br><p>
        <p>聽到聲響的艾蕾諾菈偏頭看向來人。</p>
        <p>「下午好，克雷瑟小姐。」路西恩向前走了幾步，接著將藏在身後的花束拿到身前：「這束花是毛茛，花語是『您很迷人』與『傾心不已』，願您能喜歡。」花朵五彩繽紛，個個都亮麗地綻放著。</p>
        <p>艾蕾諾菈看著花束點了點頭，接著轉頭看向一旁的女僕，女僕會意接過花朵，將櫃子上即將凋零的花汰換。</p>
        <p><br><p>
        <p>沒什麼反應，是不喜歡嗎……。</p>
        <p><br><p>
        <p>路西恩暗中觀察艾蕾諾菈的神情。</p>
        <p>那一瞬間，他竟有些許不安。</p>
        <p><br><p>
        <p>不，我是在緊張什麼？</p>
        <p>不論對方喜不喜歡都與自己無關不是嗎？</p>
        <p>更況自己隱含的譏諷貌似都沒被發現……這應該是理想的結果才對。</p>
        <p><br><p>
        <p>為了平復情緒，路西恩坐入一旁的空位，並拿起茶杯輕抿。</p>
        <p>紅茶還是一如既往地香。</p>
        <p>為了與聯姻對象熟悉，他已來拜訪克雷瑟家不下五次，對屋內的格局已經略知一二，也試探過艾蕾諾菈允許自己自由活動的程度。</p>
        <p>不過他最喜歡的空間還是現在所待的休息室，不只甜點好吃，也能與艾蕾諾菈一起坐著休息，這對平常課業繁重的路西恩來說是難得能放鬆的時光。</p>
        <p><br><p>
        <p>短暫沉默後，路西恩開口：「不好意思……請問您有書籍可以借我閱讀嗎？」</p>
        <p>艾蕾諾菈抬眸，點頭，並起身往休息室門口走去。</p>
        <p>「非常感謝您。」他起身跟上。</p>
        <p><br><p>
        <p>經過狹長的走廊與一個轉角，二人在別棟停下，艾蕾諾菈用白皙的雙手將大門推開，如祕境般的圖書館徹底拋頭露面。</p>
        <p>三層樓高的書架林立，每一寸牆面都有書本的蹤影。</p>
        <p>雖然有聽說過公爵之女十分喜愛閱讀，但藏書量之大還是讓路西恩微微倒抽一口氣。</p>
        <p>「太壯觀了……原來您有那麼多藏書。」路西恩有一瞬不知如何繼續接話，但還是趕忙找回狀態「您比較喜歡哪種類型的書籍？」</p>
        <p>「都喜歡。」艾蕾諾菈迅速回答「但最喜歡數學。」</p>
        <p>「原來如此……那請您推薦一本相關的書籍給我吧。」</p>
        <p>她點頭，走向某一排書架，並到深處停下。她伸手想拿一本書籍，卻差一點才能勾著。</p>
        <p>「您拿不到嗎？讓我來——」路西恩才剛伸手，便被細嫩冰涼的手指給抓住了手腕。</p>
        <p><br><p>
        <p>……？！</p>
        <p><br><p>
        <p>眼前少女銳利的目光轉瞬即逝，反應過來只剩她皺眉頭看著自己的樣子，像是在表達：「我自己來。」</p>
        <p>明明是拒絕的神情，卻在她精緻的五官下，莫名的……可愛。</p>
        <p><br><p>
        <p>「十分抱歉，是我失禮了。」路西恩將手收回，低頭揉了揉手腕。</p>
        <p>儘管驚嚇已過，心跳卻仍沒有恢復原狀。</p>
        <p>他感受著體內像鼓點一樣沉重的心跳聲，心情複雜。</p>
        <p>剛剛的眼神是錯覺嗎……？</p>
        <p>而且皺眉的表情意外地撩人心弦——不對，這不是重點。</p>
        <p><br><p>
        <p>艾蕾諾菈踮腳幾下，終於將書抽了出來。</p>
        <p>《概形之語——代數幾何初論》——對路西恩來說是多麼熟悉又遙遠的書名。</p>
        <p>他曾聽叔父提到過代數幾何，但在得知這是大學甚至以後才會學到的知識後，便也沒再多加留意。</p>
        <p>而眼前與自己同齡的少女，已經到了能將書籍推薦給別人的程度。</p>
        <p><br><p>
        <p>從未聽說過相關的傳聞。</p>
        <p><br><p>
        <p>看著她神色自若將書本遞給自己的樣子，路西恩手心微微出汗。</p>
        <p>「謝謝您。」他接過書，垂下眼。</p>
        <p>今日——即使無法理解，也要將它讀完。</p>
        <p>他撫摸著書封。</p>
        <p>那是他對自尊的最後堅持。</p>
      `
    },
    {
      title: "第二章",
      meta: "The Tea Party Invitation",
      content: `
        <p>「大小姐，這是寄給您的書信。」女僕將信恭敬地遞到桌前。</p>
        <p>艾蕾諾菈接過包裝精緻的信封並將其拆開，不意外地，是茶會邀請。</p>
        <p>過去她曾收過不少邀請，但都一一推拒掉了，隨著時間推移，會寄到她手上的信也只剩寥寥幾封知心好友的來信，再次收到如此正式的邀請函倒是兩年來第一次。</p>
        <p><br><p>
        <p>她看了看署名人——莉雪·瑟蘭。</p>
        <p>瑟蘭侯爵家長年與克雷瑟公爵家不對付，再加上過去有她心悅於路西恩的傳聞……不難想像她的目的。</p>
        <p>如果這次又拒絕，路西恩一定會被刁難吧。</p>
        <p>雖然他應該能完美化解——但讓人們加深對「法雷蒙少爺未婚妻」的負面印象，可不是什麼明智之舉。</p>
        <p><br><p>
        <p>「答應她吧。」艾蕾諾菈將信交還給身旁的女僕。</p>
        <p>「咦……好、好的！」女僕接過信，表情有肉眼可見的驚訝。</p>
        <p><br><p>
        <p>有那麼誇張嗎……。</p>
        <p><br><p>
        <p>雖然自己確實沒怎麼答應過茶會邀請，但並不是討厭，只是稍微懶惰點而已。</p>
        <p>正當她重新轉回思緒，門外響起敲門聲與熟悉的聲音。</p>
        <p><br><p>
        <p>「打擾了，我是路西恩·法雷蒙。」</p>
        <p>少年一進房，便將手中的禮盒交付：「請您拆開看看吧。」</p>
        <p>艾蕾諾菈輕輕拆開禮盒——是造型精緻的花瓶。</p>
        <p>「上次送了毛茛後總覺得不夠周全……所以又挑了與毛茛相配的花瓶，不知您覺得如何？」</p>
        <p>若是一般人聽到了這樣的解釋便不會多想，只認為是份體面禮物，但艾蕾諾菈深知，這仍是對自己在社交界評價的諷刺。</p>
        <p>她看著花瓶點了點頭，眼中沒有絲毫敷衍，只有對禮物真心的認同。</p>
        <p>暗諷並不重要，重點是那精細的工藝與著色，鐵定是他花了不少時間才挑得的。</p>
        <p>「您喜歡就好。」路西恩笑得明艷，眼中似有光閃過。</p>
        <p><br><p>
        <p>趁女僕換花瓶之際，艾蕾諾菈突然開口：「我……要出門。」</p>
        <p><br><p>
        <p>——「買新衣服？」路西恩聽了她簡短的講解後理解了緣由「原來您也要參加了『白茗會』啊……那我也得同行呢。」</p>
        <p>「不過挑衣服的話，我在閒暇之際也略有研究，不知我能否一同前往？」路西恩提問，話語中帶著隱隱的期盼。</p>
        <p>艾蕾諾菈點頭：「我去換衣服。」</p>
        <p><br><p>
        <p>沒過多久，大宅門前響起腳步聲，紫髮少女終於現身。</p>
        <p>原本她在家穿的衣服都以輕便為主，但外出時所穿的服裝做工精美，有更多的精巧的設計，但這倒又讓她更像美麗的人偶——不，或許比真的人偶還精緻。</p>
        <p>路西恩看著她不禁愣了神，心臟重重地落下一拍，但艾蕾諾菈並無理會，逕直朝馬車走去。</p>
        <p>隨著最後一絲紫髮拂過路西恩的臉頰，他才回過神，隨即跟上。</p>
        <p><br><p>
        <p>馬車內安靜地嚇人。</p>
        <p>車子偶爾會因顛簸發出聲響，卻仍蓋不過路西恩劇烈的心跳聲。</p>
        <p>他原以為剛剛只是被驚艷到，但不論過了多久，只要那位少女還坐在自己面前，他的心跳就沒有一絲一毫減緩，仍舊像鼓點一樣重重地落下節拍。</p>
        <p>一般人在感受到心動的時刻，只會好好享受多巴胺帶來的甜蜜，但新情感的出現卻令他恐慌——明明他從小就是被仰慕的那一方。</p>
        <p><br><p>
        <p>他曾看過不少人在自己面前羞紅著臉，不敢向前的樣子，這時他會刻意前進與對方搭話，看著對方驚惶失措的樣子，滿意地笑，順便給對方一點甜頭，讓對方為自己所用。</p>
        <p><br><p>
        <p>錯了，一切都錯了。</p>
        <p><br><p>
        <p>他在面無波瀾的外表下，悄悄深呼吸了數次，才讓狂跳的心臟平靜下來。</p>
        <p><br><p>
        <p>窗外的場景不知不覺從私人花園變換成了繁華的街道。</p>
        <p>馬車停下，路西恩率先下了車，隨後轉身向艾蕾諾菈伸出手：「請小心腳步，克雷瑟小姐。」</p>
        <p>在她的手搭上去的那一刻，他戴著白手套的手不由自主地顫了一下。</p>
        <p>她似乎也察覺到了——靛藍色的瞳眸向自己瞥了一眼又收回視線。</p>
        <p>心臟又再次不安定了起來，但這次，是被察覺所造成的慌亂。</p>
        <p><br><p>
        <p>冷靜，路西恩。</p>
        <p><br><p>
        <p>他將手撤回，裝作無視發生的樣子與少女並肩而行。</p>
        <p><br><p>
        <p>「你看你看，是克雷瑟千金和法雷蒙少爺……！」</p>
        <p>「才剛訂婚就能一起出門逛街了嗎？感情真好……。」</p>
        <p>俊男美女走在街上的樣子很快吸引了眾人的目光，四周開始傳出一些竊竊私語之聲，但二人並不理會。</p>
        <p><br><p>
        <p>「您今天是要逛哪家店呢？」路西恩笑著向身旁的少女提問。</p>
        <p>為了了解少女們的興趣、擴張人脈，他也研究過不少服飾店，如果對方去了自己熟悉的店面的話，自己也能適時提供幫助。</p>
        <p>艾蕾諾菈沒有回答，只是轉身走進不起眼的小巷。</p>
        <p>路西恩不明所以跟上，最終二人在一扇木門前停下。</p>
        <p><br><p>
        <p>房子看著就有些老舊，但入口的台階與門打掃得很乾淨，看得出房屋主人的用心。</p>
        <p>艾蕾諾菈將門推開，隨著鈴聲響起，屋內的裁縫師也抬頭看向他們。</p>
        <p>「啊～克雷瑟大小姐！又來了啊，歡迎歡迎。」男人的年紀不小，銀白色的髮絲夾雜在黑髮間，看起來有點白髮蒼蒼，但身體還算健朗。</p>
        <p>「旁邊這位是……法雷蒙少爺？！」男人嚇得差點把手上的布掉在地上。</p>
        <p>「初次見面，我是路西恩·法雷蒙，克雷瑟小姐的未婚夫。」路西恩彬彬有禮地鞠躬。</p>
        <p>「初次見面，我是阿爾班・梅里維爾！我之前有看過您在我老家舉辦的公益演出，很慶幸能在這裡見到您！您這次是陪艾蕾諾菈大小姐訂製衣服的嗎？先請坐吧，我現在去倒杯茶來。」</p>
        <p>「訂製衣服……？」</p>
        <p>「是的，大小姐的衣服都是在這裡訂製所得，是這間店的常客。」在艾蕾諾菈身後的女僕開口。</p>
        <p>「原來如此……」路西恩低頭沉思。</p>
        <p><br><p>
        <p>訂製衣服在貴族的圈子裡並不是罕見事，但通常都會找大牌子訂製，更有錢些則會專門找知名設計師，幾乎不會來找默默無聞的裁縫師。</p>
        <p>而她居然願意大老遠出門來這種地方……。</p>
        <p><br><p>
        <p>「感謝妳的回應……請問妳的名字是？」路西恩提問。</p>
        <p>「啊，失禮了，我一直沒正式介紹自己。」女僕提起裙擺敬禮「我是米蕾優·布朗雪，艾蕾諾菈大小姐的貼身僕人。」</p>
        <p>「幸會，布朗雪小姐。」路西恩笑著回應。</p>
        <p><br><p>
        <p>「大小姐這次要什麼款式的衣服？」阿爾班問。</p>
        <p>「茶會……6月的。」</p>
        <p>「這樣啊，那就是夏季服裝了呢！這次一樣是自由設計嗎？」</p>
        <p>艾蕾諾菈輕輕點了點頭。</p>
        <p>「好的！我必不會讓您失望！您先照慣例挑選您要的布料吧！」阿爾班擼起袖子，起身開始做事前準備，看起來躍躍欲試。</p>
        <p>艾蕾諾菈點頭，隨後走向一旁的櫃子，慢慢地挑選。</p>
        <p>路西恩在一旁邊喝著紅茶邊靜靜觀察她。</p>
        <p><br><p>
        <p>他自己其實對布料也略有研究，但看她在挑選時如此輕車熟路的樣子，貿然干涉只會讓她生氣吧——像上次一樣。</p>
        <p>雖然只能在一旁休息悶得他心慌，但他也毫無辦法。</p>
        <p><br><p>
        <p>不久，艾蕾諾菈將幾片小布料拿到阿爾班面前。</p>
        <p>「唔喔～您在布料的搭配上真的很有品味！如果是用這些種類來製作的話絕對沒問題，您就敬請期待吧！」阿爾班說著，隨後拿出一個袋子「對了，您上次訂製的衣服好了。」阿爾班將袋子遞出，米蕾優向前接過，接著恭敬地退到原位。</p>
        <p>阿爾班打量著艾蕾諾菈的衣著，滿意地笑了：「您現在穿的就是我上次給您的那套啊！穿起來感覺如何？」</p>
        <p>她點頭，表情雖然沒有笑容，卻讓人感覺有淡淡的暖意。</p>
        <p>——那是路西恩未曾看過的。</p>
        <p>她感到開心會是這種感覺嗎？</p>
        <p>一陣挫敗感襲來。</p>
        <p>原本他將她的冷淡潛意識歸咎為不善表達，但如今，他知道他錯了。</p>
        <p><br><p>
        <p>「大小姐，差不多要回宅邸了。」米蕾優低聲提醒。</p>
        <p>艾蕾諾菈點頭，朝門口走去。</p>
        <p>在門板完全遮蓋阿爾班的面孔前，都能聽到他說著「再見」的宏亮聲音。</p>
        <p>或許是他的活力感染了艾蕾諾菈，她在回程的路上感覺格外開心。</p>
        <p><br><p>
        <p>走出巷子，回到人來人往的街道，高級的店面也變多了起來，在經過某家甜點店時，艾蕾諾菈突然停下腳步，被櫥窗中的甜點吸引。</p>
        <p>「您有看到喜歡的甜點嗎？」路西恩也隨之停下腳步跟著看向她注視的目光。</p>
        <p>艾蕾諾菈對他點頭，感覺力道比平常重了些，而且不知是否被剛剛的好情緒影響，她感覺雙眼都在發光。</p>
        <p>看到艾蕾諾菈難得擺出雀躍的表情，路西恩稍微頓了下，隨後低頭看向櫥窗：「『露霧花酥』嗎……是每年春季才有的限定商品呢，難怪您那麼想要。我馬上為您購買。」</p>
        <p><br><p>
        <p>沒過多久，路西恩便提著精緻的小袋子從店內走出。</p>
        <p>「我多買了幾盒，如果可以的話，希望能與您下次一同在宅邸享用。」</p>
        <p>艾蕾諾菈思索片刻，點頭答應。</p>
        <p>「感謝您。」路西恩說完，米蕾優接過了袋子，隨後三人一同往馬車的方向前進。</p>
      `
    }
  ];

  const Library = ({ chapters, isEditMode, onEdit, onEditDetail }: { chapters: any[]; isEditMode?: boolean; onEdit?: () => void; onEditDetail?: (index: number) => void }) => {
    const [currentChapter, setCurrentChapter] = useState(0);
    const readerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (currentChapter >= chapters.length && chapters.length > 0) {
        setCurrentChapter(chapters.length - 1);
      }
    }, [chapters, currentChapter]);

    const chapter = chapters[currentChapter] || chapters[0] || { title: '無章節', subTitle: '', meta: '', content: '<p>目前沒有章節資料。</p>' };

    return (
      <div className="archive-container">
        <div className="sidebar-archive relative">
          {isEditMode && (
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#bdbade] hover:bg-[#8a7f9c] flex items-center justify-center text-white text-[10px] font-bold shadow-sm z-[100] transition-colors cursor-pointer"
            >
              ✎
            </button>
          )}
          <div className="sidebar-header-archive">ARCHIVE // 希鷺倫日誌</div>
          <ul className="chapter-list">
            {chapters.map((ch, idx) => (
              <li 
                key={idx} 
                className={`chapter-item ${currentChapter === idx ? 'active' : ''}`} 
                onClick={() => {
                  setCurrentChapter(idx);
                  if (readerRef.current) readerRef.current.scrollTop = 0;
                }}
              >
                {ch.title}：{ch.subTitle || ''}
              </li>
            ))}
          </ul>
        </div>

        <div className="main-content-archive relative" id="reader" ref={readerRef}>
          {isEditMode && (
            <button 
              onClick={(e) => { e.stopPropagation(); onEditDetail?.(currentChapter); }}
              className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#bdbade] hover:bg-[#8a7f9c] flex items-center justify-center text-white text-[10px] font-bold shadow-sm z-[100] transition-colors cursor-pointer"
            >
              ✎
            </button>
          )}
          <div className="article-body">
            <h1 className="article-title">{chapter.title}：{chapter.subTitle || ''}</h1>
            <div className="article-meta">{chapter.meta}</div>
            <div dangerouslySetInnerHTML={{ __html: chapter.content }} />
          
          <div className="mobile-back-to-top">
            <button onClick={() => {
              if (readerRef.current) {
                readerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}>
              回到頂部
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingSupplement = ({ 
  isEditMode, 
  onEdit,
  supplementList,
  setSupplementList
}: { 
  isEditMode?: boolean; 
  onEdit?: () => void;
  supplementList: any[];
  setSupplementList: any;
}) => {
  const [supplementDeck, setSupplementDeck] = useState<any[]>([]);
  const [currentItem, setCurrentItem] = useState<any | null>(null);

  useEffect(() => {
    if (supplementList && supplementList.length > 0) {
      if (!currentItem) {
        const randomIndex = Math.floor(Math.random() * supplementList.length);
        setCurrentItem(supplementList[randomIndex]);
      } else {
        const exists = supplementList.find(s => s.title === currentItem.title);
        if (!exists) {
          setCurrentItem(supplementList[0]);
        } else {
          // If the exists item content changed, update the display item
          if (exists.content !== currentItem.content || exists.category !== currentItem.category) {
            setCurrentItem(exists);
          }
        }
      }
    } else {
      setCurrentItem(null);
    }
  }, [supplementList, currentItem]);

  const shuffleSupplement = () => {
    if (!supplementList || supplementList.length === 0) return;
    let currentDeck = [...supplementDeck];
    const validDeck = currentDeck.filter(item => supplementList.some(s => s.title === item.title));
    
    if (validDeck.length === 0) {
      let items = [...supplementList];
      if (items.length > 1 && currentItem) {
        items = items.filter(item => item.title !== currentItem.title);
      }
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
      const chosen = items.pop();
      setSupplementDeck(items);
      if (chosen) {
        setCurrentItem(chosen);
      }
    } else {
      const idx = Math.floor(Math.random() * validDeck.length);
      const chosen = validDeck[idx];
      const newDeck = validDeck.filter((_, i) => i !== idx);
      setSupplementDeck(newDeck);
      setCurrentItem(chosen);
    }
  };

  if (!currentItem) {
    return (
      <div className="setting-container relative flex items-center justify-center p-6 text-gray-400 italic text-xs">
        {isEditMode && (
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#bdbade] hover:bg-[#8a7f9c] flex items-center justify-center text-white text-[10px] font-bold shadow-sm z-[100] transition-colors cursor-pointer"
          >
            ✎
          </button>
        )}
        無補充資訊
      </div>
    );
  }

  return (
    <div className="setting-container relative">
      {isEditMode && (
        <>
          <button 
            onClick={(e) => { e.stopPropagation(); shuffleSupplement(); }}
            className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#bdbade] hover:bg-[#8a7f9c] flex items-center justify-center text-white text-[10px] font-bold shadow-sm z-[100] transition-colors cursor-pointer"
            title="隨機跳轉"
          >
            🎲
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#bdbade] hover:bg-[#8a7f9c] flex items-center justify-center text-white text-[10px] font-bold shadow-sm z-[100] transition-colors cursor-pointer"
            title="編輯補充"
          >
            ✎
          </button>
        </>
      )}
      <div className="setting-header">System Supplement // 資訊補充</div>
      <div className="setting-item">
        <span className="setting-title">
          <span className="category-tag">{currentItem.category}</span>{currentItem.title}
        </span>
        <div className="setting-content" dangerouslySetInnerHTML={{ __html: renderSupplementContent(currentItem.content) }} />
      </div>
      <div className="setting-footer">ACADEMY ARCHIVE SECTION</div>
    </div>
  );
};

const SupplementEditor = ({
  tempSupplementList,
  setTempSupplementList,
  editingSupplementIndex,
  setEditingSupplementIndex,
  handleCloseRequest,
  handleSaveSupplement,
  setIsDirty
}: {
  tempSupplementList: any[];
  setTempSupplementList: any;
  editingSupplementIndex: number;
  setEditingSupplementIndex: any;
  handleCloseRequest: () => void;
  handleSaveSupplement: () => void;
  setIsDirty: any;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentSup = tempSupplementList[editingSupplementIndex] || tempSupplementList[0];

  const handleWrapHighlight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) return;
    
    const text = textarea.value;
    const selected = text.substring(start, end);
    const wrapped = `*${selected}*`;
    const updatedText = text.substring(0, start) + wrapped + text.substring(end);
    
    const updated = [...tempSupplementList];
    updated[editingSupplementIndex].content = updatedText;
    setTempSupplementList(updated);
    setIsDirty(true);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + wrapped.length);
    }, 50);
  };

  return (
    <div className="flex-grow flex flex-col justify-start items-stretch text-left overflow-hidden">
      {/* Top Button row: existing items + "+" button */}
      <div className="flex items-center gap-2 mb-4 p-1 bg-gray-50 rounded-xl overflow-x-auto flex-shrink-0">
        {tempSupplementList.map((sup, idx) => (
          <button
            key={idx}
            onClick={() => setEditingSupplementIndex(idx)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${editingSupplementIndex === idx ? 'bg-[#8a7f9c] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 bg-white/50'}`}
          >
            {sup.title || `未命名補充 #${idx + 1}`}
          </button>
        ))}
        <button
          onClick={() => {
            const newSup = {
              category: "共生",
              title: "新項目",
              content: "新項目內容"
            };
            const updated = [...tempSupplementList, newSup];
            setTempSupplementList(updated);
            setEditingSupplementIndex(updated.length - 1);
            setIsDirty(true);
          }}
          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all cursor-pointer"
          title="新增補充"
        >
          + 新增
        </button>
      </div>

      {/* Display active supplement form */}
      {currentSup ? (
        <div className="space-y-4 overflow-y-auto pr-2 flex-grow max-h-[50vh] flex flex-col">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500">類型 (Category)</label>
              <input 
                type="text"
                value={currentSup.category || ""}
                onChange={(e) => {
                  const updated = [...tempSupplementList];
                  updated[editingSupplementIndex].category = e.target.value;
                  setTempSupplementList(updated);
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-700"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500">標題 (Title)</label>
              <input 
                type="text"
                value={currentSup.title || ""}
                onChange={(e) => {
                  const updated = [...tempSupplementList];
                  updated[editingSupplementIndex].title = e.target.value;
                  setTempSupplementList(updated);
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-700"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 flex-grow">
            <label className="text-xs font-bold text-gray-500">內容 (Content)</label>
            <textarea 
              ref={textareaRef}
              value={currentSup.content || ""}
              onChange={(e) => {
                const updated = [...tempSupplementList];
                updated[editingSupplementIndex].content = e.target.value;
                setTempSupplementList(updated);
                setIsDirty(true);
              }}
              className="w-full flex-grow min-h-[150px] p-3 border border-gray-200 rounded-lg text-xs text-gray-700 font-mono resize-none"
              placeholder="請輸入內容..."
            />
            {/* A button to wrap selected text in highlight */}
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={handleWrapHighlight}
                className="px-3 py-1.5 rounded-lg bg-pink-100 hover:bg-pink-200 text-pink-600 border border-pink-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="將選取文字標註為粉色重點"
              >
                <span className="font-serif">A</span> 變粉色
              </button>
              <span className="text-[10px] text-gray-400">
                提示：先在上方框中選取想變粉色的文字，然後點擊此「A」按鈕。
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 text-xs italic">
          尚無項目，請點擊「+ 新增」按鈕新增
        </div>
      )}

      {/* Footer actions */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0">
        {currentSup && (
          <button 
            type="button"
            onClick={() => {
              const updated = tempSupplementList.filter((_, idx) => idx !== editingSupplementIndex);
              setTempSupplementList(updated);
              setEditingSupplementIndex(0);
              setIsDirty(true);
            }}
            className="mr-auto px-4 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            刪除此補充項目
          </button>
        )}
        <button 
          onClick={handleCloseRequest}
          className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          取消
        </button>
        <button 
          onClick={handleSaveSupplement}
          className="px-5 py-1.5 bg-[#8a7f9c] hover:bg-[#746db5] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          儲存
        </button>
      </div>
    </div>
  );
};

const ObservationCard: React.FC<{ 
  charId: number, 
  onSelectChar: (id: number) => void, 
  isEditMode?: boolean, 
  onEdit?: () => void,
  isGraduated: boolean,
  setIsGraduated: (val: boolean) => void,
  observationState: any[]
}> = ({ charId, onSelectChar, isEditMode, onEdit, isGraduated, setIsGraduated, observationState }) => {
  const data = observationState.find(c => c.id === charId);
  if (!data) return null;

  const current = isGraduated ? data.graduate : data.freshman;
  const isCorrupted = (data as any).isYvel && isGraduated;

  return (
    <div className={`observation-card relative ${isCorrupted ? 'corrupted' : ''}`} style={{ 
      '--P': isCorrupted ? '#ff4d4d' : data.colors.P, 
      '--A': isCorrupted ? '#666' : data.colors.A, 
      '--H': isCorrupted ? '#000' : data.colors.H, 
      '--Q': isCorrupted ? '#eee' : data.colors.Q, 
      '--B': isCorrupted ? '#444' : data.colors.B 
    } as React.CSSProperties}>
      {isEditMode && (
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#bdbade] hover:bg-[#8a7f9c] flex items-center justify-center text-white text-[10px] font-bold shadow-sm z-[100] transition-colors cursor-pointer"
        >
          ✎
        </button>
      )}
      <div className="file-header">
        {isCorrupted ? "◈ WARNING: SYSTEM ERROR ◈" : ((data as any).isYvel ? "STUDENT FILE 00" : "STUDENT FILE")}
      </div>
      <div className="card-controls">
        {!data.noToggle && (
          <button className="toggle-btn mr-2" onClick={() => setIsGraduated(!isGraduated)}>
            {(data as any).isYvel 
              ? (isGraduated ? "RESTORE: ???" : "OBSERVE: 入學") 
              : `OBSERVE: ${isGraduated ? "畢業" : "入學"}`}
          </button>
        )}
        <button className="toggle-btn" onClick={() => {
          const available = observationState.filter(c => c.id !== charId);
          if (available.length > 0) {
            const randomChar = available[Math.floor(Math.random() * available.length)];
            onSelectChar(randomChar.id);
          }
        }}>
          切換檔案
        </button>
      </div>
      <div className="name-container">
        <span className="name-zh" key={`zh-${charId}-${isGraduated}`}>{data.nameZh}</span>
        <span className="name-en" key={`en-${charId}-${isGraduated}`}>{data.nameEn}</span>
      </div>
      <div className="quote" key={`quote-${charId}-${isGraduated}`}>
        {current.quote}
      </div>
      <div className="stats-grid">
        <div className="stat-group">
          <div className="stat-item" style={{ animationDelay: '1.3s' }} key={`attr-${charId}-${isGraduated}`}>
            <span className="stat-label">擅長屬性</span>
            <span className={`stat-value ${isCorrupted ? 'glitch' : ''}`}>{current.attr}</span>
          </div>
          <div className="stat-item" style={{ animationDelay: '1.5s' }} key={`mana-${charId}-${isGraduated}`}>
            <span className="stat-label">魔力總量</span>
            <span className={`stat-value ${isCorrupted ? 'glitch' : ''}`}>{current.mana}</span>
          </div>
          <div className="stat-item" style={{ animationDelay: '1.7s' }} key={`stab-${charId}-${isGraduated}`}>
            <span className="stat-label">魔法穩定性</span>
            <span className={`stat-value ${isCorrupted ? 'glitch' : ''}`}>{current.stability}</span>
          </div>
        </div>
        <div className="stat-group">
          <div className="stat-item" style={{ animationDelay: '1.3s' }} key={`talent-${charId}-${isGraduated}`}>
            <span className="stat-label">劍術資質</span>
            <span className={`stat-value ${isCorrupted ? 'glitch' : ''}`}>{current.talent}</span>
          </div>
          <div className="stat-item" style={{ animationDelay: '1.5s' }} key={`ability-${charId}-${isGraduated}`}>
            <span className="stat-label">劍術能力</span>
            <span className={`stat-value ${isCorrupted ? 'glitch' : ''}`}>{current.ability}</span>
          </div>
          <div className="stat-item" style={{ animationDelay: '1.7s' }} key={`beast-${charId}-${isGraduated}`}>
            <span className="stat-label">魔獸：</span>
            <span className={`stat-value ${isCorrupted ? 'glitch' : ''}`}>{current.beastSync}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const getInitialOrientation = (url: string): 'portrait' | 'landscape' | 'square' => {
  const filename = decodeURIComponent(url.split('/').pop() || '').toLowerCase();
  if (filename.includes('img_5697') || filename.includes('fb_img_1749826495034') || filename.includes('fb_img_1769782908274') || filename.includes('1121') || filename.includes('878') || filename.includes('1103')) {
    return 'portrait';
  }
  if (filename.includes('1033') || filename.includes('1148') || filename.includes('1129')) {
    return 'landscape';
  }
  return 'square';
};

const normalizeGroups = (groups: any[]): any[] => {
  if (!groups || !Array.isArray(groups)) return [];
  const normalized: any[] = [];
  
  groups.forEach((group) => {
    if (!group || !group.rows) return;
    const size4Items: any[] = [];
    const otherItems: any[] = [];
    
    group.rows.forEach((row: any) => {
      if (!row || !row.items) return;
      row.items.forEach((item: any) => {
        if (item.size === 4) {
          size4Items.push(item);
        } else {
          otherItems.push(item);
        }
      });
    });
    
    size4Items.forEach((item) => {
      normalized.push({
        id: `group-auto-${item.id}-${Date.now()}`,
        rows: [
          {
            id: `row-auto-${item.id}-${Date.now()}`,
            items: [item]
          }
        ]
      });
    });
    
    if (otherItems.length > 0) {
      const rows: any[] = [];
      let currentRowItems: any[] = [];
      
      otherItems.forEach((item) => {
        if (item.size === 2) {
          if (currentRowItems.length > 0) {
            rows.push({
              id: `row-norm-${Date.now()}-${rows.length}`,
              items: currentRowItems
            });
            currentRowItems = [];
          }
          rows.push({
            id: `row-norm-${Date.now()}-${rows.length}`,
            items: [item]
          });
        } else {
          currentRowItems.push(item);
          if (currentRowItems.length === 2) {
            rows.push({
              id: `row-norm-${Date.now()}-${rows.length}`,
              items: currentRowItems
            });
            currentRowItems = [];
          }
        }
      });
      
      if (currentRowItems.length > 0) {
        rows.push({
          id: `row-norm-${Date.now()}-${rows.length}`,
          items: currentRowItems
        });
      }
      
      normalized.push({
        id: group.id || `group-norm-${Date.now()}`,
        rows
      });
    }
  });
  
  return normalized;
};

const migrateGalleryItems = (oldItems: any[]): any[] => {
  if (!oldItems || !Array.isArray(oldItems)) return [];
  if (oldItems.length > 0 && oldItems[0].rows !== undefined) {
    return oldItems;
  }
  
  const migrated = oldItems.map((item, idx) => {
    const groupId = `group-${idx}-${Date.now()}`;
    if (item.type === 'portrait') {
      const url = item.url;
      const orientation = getInitialOrientation(url);
      return {
        id: groupId,
        rows: [
          {
            id: `row-${groupId}-0`,
            items: [{ id: `img-${groupId}-0`, url, size: 4, orientation }]
          }
        ]
      };
    } else if (item.type === 'stack') {
      const urls = item.urls || [];
      return {
        id: groupId,
        rows: urls.map((url: string, uidx: number) => {
          const orientation = getInitialOrientation(url);
          let size: 1 | 2 | 4 = 2;
          if (orientation === 'portrait') size = 4;
          else if (orientation === 'square') size = 1;
          return {
            id: `row-${groupId}-${uidx}`,
            items: [{ id: `img-${groupId}-${uidx}`, url, size, orientation }]
          };
        })
      };
    } else if (item.type === 'grid-2x2') {
      const topRow = item.topRow || [];
      const bottomRow = item.bottomRow || [];
      const rows = [];
      if (topRow.length > 0) {
        rows.push({
          id: `row-${groupId}-top`,
          items: topRow.map((url: string, uidx: number) => {
            const orientation = getInitialOrientation(url);
            return { id: `img-${groupId}-top-${uidx}`, url, size: 1, orientation };
          })
        });
      }
      if (bottomRow.length > 0) {
        rows.push({
          id: `row-${groupId}-bottom`,
          items: bottomRow.map((url: string, bidx: number) => {
            const orientation = getInitialOrientation(url);
            return { id: `img-${groupId}-bottom-${bidx}`, url, size: 1, orientation };
          })
        });
      }
      return { id: groupId, rows };
    } else if (item.type === 'complex') {
      const top = item.top;
      const bottom = item.bottom || [];
      const rows = [];
      if (top) {
        const orientation = getInitialOrientation(top);
        rows.push({
          id: `row-${groupId}-top`,
          items: [{ id: `img-${groupId}-top`, url: top, size: 2, orientation }]
        });
      }
      if (bottom.length > 0) {
        rows.push({
          id: `row-${groupId}-bottom`,
          items: bottom.map((url: string, bidx: number) => {
            const orientation = getInitialOrientation(url);
            return { id: `img-${groupId}-bottom-${bidx}`, url, size: 1, orientation };
          })
        });
      }
      return { id: groupId, rows };
    }
    
    return {
      id: groupId,
      rows: []
    };
  });
  
  return normalizeGroups(migrated);
};

const validateGalleryLayout = (groups: any[], artMetadata: any): { valid: boolean; message?: string } => {
  for (let gIdx = 0; gIdx < groups.length; gIdx++) {
    const group = groups[gIdx];
    const allItems: any[] = [];
    group.rows?.forEach((row: any) => {
      row.items?.forEach((item: any) => {
        allItems.push(item);
      });
    });

    const totalItems = allItems.length;

    for (let rIdx = 0; rIdx < (group.rows?.length || 0); rIdx++) {
      const row = group.rows[rIdx];
      for (let iIdx = 0; iIdx < (row.items?.length || 0); iIdx++) {
        const item = row.items[iIdx];
        const filename = decodeURIComponent(item.url.split('/').pop() || '');
        const title = artMetadata?.[filename]?.title || artMetadata?.[item.url]?.title || filename || "未命名圖片";

        if (item.size === 4) {
          if (totalItems > 1) {
            return {
              valid: false,
              message: `儲存失敗：大小為 4 的圖片「${title}」必須是獨立群組，群組內不能有其他圖片。`
            };
          }
        } else if (item.size === 2) {
          if (totalItems === 1) {
            return {
              valid: false,
              message: `儲存失敗：大小為 2 的圖片「${title}」不能單獨一組，其上方或下方必須有其他大小為 1 或 2 的圖片。`
            };
          }
        } else if (item.size === 1) {
          if (totalItems === 1) {
            return {
              valid: false,
              message: `儲存失敗：大小為 1 的圖片「${title}」不能單獨一組，其周圍（左、右、上或下）必須有其他大小為 1 或 2 的圖片。`
            };
          }
        }
      }
    }
  }
  return { valid: true };
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [wikiTab, setWikiTab] = useState('w1');
  const [charTab, setCharTab] = useState('c1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoadProgress, setAudioLoadProgress] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [timer, setTimer] = useState("00 Days 00 Hours 00 Mins 00 Secs");

  // Music Player Persistent State
  const [playerConfig, setPlayerConfig] = useState(() => {
    const saved = localStorage.getItem('player_config_v1');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        if (config.audioUrl && config.audioUrl.startsWith('blob:')) {
          config.audioUrl = "https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/蜜月アン・ドゥ・トロワ_ DATEKEN 【ピアノカバー】_320k (1).mp3";
          config.audioFileName = "蜜月アン・ドゥ・トロワ_ DATEKEN 【ピアノカバー】_320k (1).mp3";
        }
        return config;
      } catch (e) {}
    }
    return {
      title: "蜜月アン・ドゥ・トロワ",
      audioFileName: "蜜月アン・ドゥ・トロワ_ DATEKEN 【ピアノカバー】_320k (1).mp3",
      audioUrl: "https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/蜜月アン・ドゥ・トロワ_ DATEKEN 【ピアノカバー】_320k (1).mp3",
      imageFileName: "394f689230e73f8fb61f7ad38ef09d2c.jpg",
      imageUrl: "https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/394f689230e73f8fb61f7ad38ef09d2c.jpg",
      volume: 100
    };
  });

  const [timerLabel, setTimerLabel] = useState(() => {
    return localStorage.getItem('timer_label_v1') || "Eleanora Cressel & Lucien Valemont";
  });

  useEffect(() => {
    localStorage.setItem('timer_label_v1', timerLabel);
  }, [timerLabel]);

  // Load from Firestore on mount
  useEffect(() => {
    const fetchFirebaseData = async () => {
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.line1 !== undefined && data.line2 !== undefined) {
            setPrefaceConfig({ line1: data.line1, line2: data.line2 });
          }
          if (data.galleryTitle !== undefined) {
            setGalleryTitle(data.galleryTitle);
          }
          if (data.timerLabel !== undefined) {
            setTimerLabel(data.timerLabel);
          }
          if (data.targetDateStr !== undefined) {
            setTargetDateStr(data.targetDateStr);
          }
          if (data.charactersState !== undefined) {
            setCharactersState(data.charactersState);
          }
          if (data.chaptersState !== undefined) {
            setChaptersState(data.chaptersState);
          }
          if (data.wikiData !== undefined) {
            setWikiData(data.wikiData);
          }
          if (data.galleryItemsState !== undefined) {
            setGalleryItemsState(data.galleryItemsState);
          }
          if (data.artMetadataState !== undefined) {
            setArtMetadataState(data.artMetadataState);
          }
          if (data.observationState !== undefined) {
            setObservationState(data.observationState);
          }
          if (data.triviaList !== undefined) {
            setTriviaList(data.triviaList);
          }
          if (data.supplementList !== undefined) {
            setSupplementList(data.supplementList);
          }
          if (data.videoListState !== undefined) {
            setVideoListState(data.videoListState);
          }
          if (data.playerConfig !== undefined) {
            setPlayerConfig(data.playerConfig);
          }
          if (data.sources !== undefined) {
            setSources(data.sources);
          }
        }
      } catch (error) {
        console.error("Error fetching from Firebase:", error);
      }
    };
    fetchFirebaseData();
  }, []);

  // Generic field sync to Firestore (used by individual save handlers below)
  const saveFieldToFirebase = async (field: string, value: any) => {
    try {
      await setDoc(docRef, {
        [field]: value,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error(`Error syncing ${field} to Firebase:`, error);
    }
  };

  // Preface Persistent State
  const [prefaceConfig, setPrefaceConfig] = useState(() => {
    const saved = localStorage.getItem('preface_config_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      line1: "這是關於面臨困境的青少年們",
      line2: "如何成長的故事"
    };
  });

  // Timer Target Date Persistent State
  const [targetDateStr, setTargetDateStr] = useState(() => {
    return localStorage.getItem('timer_target_date_v1') || "2025/05/27";
  });

  // Gallery Title and Items Persistent States
  const [galleryTitle, setGalleryTitle] = useState(() => {
    return localStorage.getItem('gallery_title_v1') || "GALLERY";
  });

  useEffect(() => {
    localStorage.setItem('gallery_title_v1', galleryTitle);
  }, [galleryTitle]);

  const [galleryItemsState, setGalleryItemsState] = useState<any[]>(() => {
    const saved = localStorage.getItem('gallery_items_v1');
    let items = null;
    if (saved) {
      try { items = JSON.parse(saved); } catch (e) {}
    }
    if (!items) {
      items = [
        { 
          type: 'complex', 
          top: 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1033_20260101025628.png',
          bottom: [
            'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/無標題1148.png',
            'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/無標題1129_20260402112145.png'
          ]
        },
        { type: 'portrait', url: 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/IMG_5697.png' },
        { type: 'stack', urls: ['https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C951_20260118020109.png', 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1067_20260118005441.png'] },
        { type: 'portrait', url: 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/FB_IMG_1749826495034.jpg' },
        { 
          type: 'grid-2x2', 
          topRow: ['https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C933_20250810153340.png', 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C933_20250811052051.png'],
          bottomRow: ['https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1102_20260208235836.png', 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1102_20260208235846.png']
        },
        { type: 'portrait', url: 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/FB_IMG_1769782908274.jpg' },
        { type: 'stack', urls: ['https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C397_20251222082314.png', 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C393_20251215195508.png'] },
        { type: 'portrait', url: 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1121_20260219211404.png' },
        { type: 'stack', urls: ['https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C887_20250622181052.png', 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C887_20250622210234.png'] },
        { type: 'stack', urls: ['https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1016_20251216121552.png', 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1016_20251216090827.png'] },
        { type: 'portrait', url: 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C878_20250614021733.png' },
        { type: 'portrait', url: 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1103_20260210015346.png' },
        { type: 'stack', urls: ['https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/FB_IMG_1751735099362.jpg', 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C860_20250618164117.png'] }
      ];
    }
    return migrateGalleryItems(items);
  });

  useEffect(() => {
    localStorage.setItem('gallery_items_v1', JSON.stringify(galleryItemsState));
  }, [galleryItemsState]);

  // Art Metadata State
  const [artMetadataState, setArtMetadataState] = useState(() => {
    const saved = localStorage.getItem('art_metadata_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return ART_METADATA;
  });

  useEffect(() => {
    localStorage.setItem('art_metadata_v1', JSON.stringify(artMetadataState));
  }, [artMetadataState]);

  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [selectedArt, setSelectedArt] = useState<string | null>(null);
  const scrollYBeforeDetailRef = useRef(0);
  useEffect(() => {
    // 「點圖看詳細資訊時背景固定」的正確做法：鎖定 body 的捲動（body scroll lock），
    // 而不是靠 position:fixed 的疊層去模擬固定背景——後者在手機上跟 detail-mode
    // 版面高度變化互動時，很容易觸發瀏覽器整頁縮放，也是「返回後跳到奇怪位置」的
    // 根本原因（版面高度改變後，瀏覽器只是留在同一個像素捲動量，落點自然不對）。
    // 進入詳細檢視時記錄目前捲動位置、把 body 固定住；離開時解除固定並精準跳回
    // 原本的捲動位置，畫面就不會跳走。
    if (selectedArt) {
      scrollYBeforeDetailRef.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollYBeforeDetailRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
    } else {
      const savedScrollY = scrollYBeforeDetailRef.current;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      window.scrollTo(0, savedScrollY);
    }
  }, [selectedArt]);
  const [randomCharId, setRandomCharId] = useState(0);
  const [seenCharIds, setSeenCharIds] = useState<number[]>([]);
  const [currentTrivia, setCurrentTrivia] = useState("");
  const [triviaRotation, setTriviaRotation] = useState(0);

  // Sources/Data Sources States
  const [sources, setSources] = useState<{ name: string; url: string }[]>(() => {
    const saved = localStorage.getItem('sources_list_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      { name: "蜜月アン・ドゥ・トロワ", url: "https://youtu.be/vajo0DgyZWU?si=Nz7lglPSkpizAXQP" },
      { name: "OCEAN EYES", url: "https://youtu.be/viimfQi_pUw?si=0VPGDEpk8XviBodF" }
    ];
  });
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceError, setNewSourceError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('sources_list_v1', JSON.stringify(sources));
  }, [sources]);

  const [galleryImageInput, setGalleryImageInput] = useState('');

  // Editing States
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [activeEditSection, setActiveEditSection] = useState<string | null>(null);
  const [editingChapterIndex, setEditingChapterIndex] = useState<number | null>(null);
  const [tempWikiData, setTempWikiData] = useState<any>(null);
  const [tempChaptersState, setTempChaptersState] = useState<any[]>([]);
  const [tempArtMetadataState, setTempArtMetadataState] = useState<any>(null);
  const [tempGalleryTitle, setTempGalleryTitle] = useState<string>("");
  const [tempGalleryItemsState, setTempGalleryItemsState] = useState<any[]>([]);
  const [tempChapterContentText, setTempChapterContentText] = useState<string>("");
  const [tempPlayerConfig, setTempPlayerConfig] = useState<any>(null);
  const [tempPrefaceConfig, setTempPrefaceConfig] = useState<any>(null);
  const [tempTargetDateStr, setTempTargetDateStr] = useState<string>("");
  const [isDirty, setIsDirty] = useState(false);
  const [isLayoutDirty, setIsLayoutDirty] = useState(false);

  // Synchronize temp states for gallery layout when entering edit mode
  useEffect(() => {
    if (isEditMode) {
      if (!tempGalleryItemsState || tempGalleryItemsState.length === 0) {
        setTempGalleryItemsState(JSON.parse(JSON.stringify(galleryItemsState)));
      }
      if (!tempArtMetadataState) {
        setTempArtMetadataState(JSON.parse(JSON.stringify(artMetadataState)));
      }
      if (!tempGalleryTitle) {
        setTempGalleryTitle(galleryTitle);
      }
    } else {
      setTempGalleryItemsState([]);
      setTempArtMetadataState(null);
      setTempGalleryTitle("");
    }
  }, [isEditMode, galleryItemsState, artMetadataState, galleryTitle]);

  const handleOrientationChange = (itemId: string, newOrientation: 'portrait' | 'landscape' | 'square') => {
    let newGroups = JSON.parse(JSON.stringify(tempGalleryItemsState));
    for (let gIdx = 0; gIdx < newGroups.length; gIdx++) {
      const group = newGroups[gIdx];
      for (let rIdx = 0; rIdx < group.rows.length; rIdx++) {
        const row = group.rows[rIdx];
        for (let iIdx = 0; iIdx < row.items.length; iIdx++) {
          const item = row.items[iIdx];
          if (item.id === itemId) {
            item.orientation = newOrientation;
            if (newOrientation === 'portrait') {
              item.size = 4;
            } else if (newOrientation === 'landscape' && item.size === 1) {
              item.size = 2;
            }
            break;
          }
        }
      }
    }
    newGroups = normalizeGroups(newGroups);
    setTempGalleryItemsState(newGroups);
    setIsDirty(true);
    setIsLayoutDirty(true);
  };

  const handleSizeChange = (itemId: string, newSize: 1 | 2 | 4) => {
    let newGroups = JSON.parse(JSON.stringify(tempGalleryItemsState));
    for (let gIdx = 0; gIdx < newGroups.length; gIdx++) {
      const group = newGroups[gIdx];
      for (let rIdx = 0; rIdx < group.rows.length; rIdx++) {
        const row = group.rows[rIdx];
        for (let iIdx = 0; iIdx < row.items.length; iIdx++) {
          const item = row.items[iIdx];
          if (item.id === itemId) {
            item.size = newSize;
            break;
          }
        }
      }
    }
    newGroups = normalizeGroups(newGroups);
    setTempGalleryItemsState(newGroups);
    setIsDirty(true);
    setIsLayoutDirty(true);
  };

  const handleMoveAction = (itemId: string, direction: 'up' | 'down' | 'left' | 'right' | 'swap-row' | 'split' | 'merge-left' | 'merge-right') => {
    let newGroups = JSON.parse(JSON.stringify(tempGalleryItemsState));
    
    let gIdx = -1, rIdx = -1, iIdx = -1;
    for (let g = 0; g < newGroups.length; g++) {
      for (let r = 0; r < newGroups[g].rows.length; r++) {
        for (let i = 0; i < newGroups[g].rows[r].items.length; i++) {
          if (newGroups[g].rows[r].items[i].id === itemId) {
            gIdx = g;
            rIdx = r;
            iIdx = i;
            break;
          }
        }
      }
    }
    
    if (gIdx === -1) return;
    
    const group = newGroups[gIdx];
    const row = group.rows[rIdx];
    const item = row.items[iIdx];
    
    if (direction === 'left') {
      if (gIdx > 0) {
        const temp = newGroups[gIdx];
        newGroups[gIdx] = newGroups[gIdx - 1];
        newGroups[gIdx - 1] = temp;
      }
    } else if (direction === 'right') {
      if (gIdx < newGroups.length - 1) {
        const temp = newGroups[gIdx];
        newGroups[gIdx] = newGroups[gIdx + 1];
        newGroups[gIdx + 1] = temp;
      }
    } else if (direction === 'up') {
      if (rIdx > 0) {
        const temp = group.rows[rIdx];
        group.rows[rIdx] = group.rows[rIdx - 1];
        group.rows[rIdx - 1] = temp;
      }
    } else if (direction === 'down') {
      if (rIdx < group.rows.length - 1) {
        const temp = group.rows[rIdx];
        group.rows[rIdx] = group.rows[rIdx + 1];
        group.rows[rIdx + 1] = temp;
      }
    } else if (direction === 'swap-row') {
      if (row.items.length === 2) {
        const temp = row.items[0];
        row.items[0] = row.items[1];
        row.items[1] = temp;
      }
    } else if (direction === 'split') {
      row.items.splice(iIdx, 1);
      if (row.items.length === 0) {
        group.rows.splice(rIdx, 1);
      }
      
      const newGroup = {
        id: `group-split-${Date.now()}`,
        rows: [
          {
            id: `row-split-${Date.now()}`,
            items: [item]
          }
        ]
      };
      
      newGroups.splice(gIdx + 1, 0, newGroup);
    } else if (direction === 'merge-left') {
      if (gIdx > 0) {
        const leftGroup = newGroups[gIdx - 1];
        const leftHasSize4 = leftGroup.rows?.some((r: any) => r.items?.some((it: any) => it.size === 4));
        const currentHasSize4 = group.rows?.some((r: any) => r.items?.some((it: any) => it.size === 4));
        
        if (!leftHasSize4 && !currentHasSize4) {
          leftGroup.rows = leftGroup.rows || [];
          leftGroup.rows.push(...group.rows);
          newGroups.splice(gIdx, 1);
        } else {
          alert("包含大小為 4 的獨立群組無法進行合併！");
          return;
        }
      }
    } else if (direction === 'merge-right') {
      if (gIdx < newGroups.length - 1) {
        const rightGroup = newGroups[gIdx + 1];
        const rightHasSize4 = rightGroup.rows?.some((r: any) => r.items?.some((it: any) => it.size === 4));
        const currentHasSize4 = group.rows?.some((r: any) => r.items?.some((it: any) => it.size === 4));
        
        if (!rightHasSize4 && !currentHasSize4) {
          rightGroup.rows = rightGroup.rows || [];
          rightGroup.rows.unshift(...group.rows);
          newGroups.splice(gIdx, 1);
        } else {
          alert("包含大小為 4 的獨立群組無法進行合併！");
          return;
        }
      }
    }
    
    newGroups = normalizeGroups(newGroups);
    setTempGalleryItemsState(newGroups);
    setIsDirty(true);
    setIsLayoutDirty(true);
  };

  const handleDeleteItem = (itemId: string) => {
    let newGroups = JSON.parse(JSON.stringify(tempGalleryItemsState));
    for (let g = 0; g < newGroups.length; g++) {
      for (let r = 0; r < newGroups[g].rows.length; r++) {
        const i = newGroups[g].rows[r].items.findIndex((it: any) => it.id === itemId);
        if (i !== -1) {
          newGroups[g].rows[r].items.splice(i, 1);
          break;
        }
      }
    }
    newGroups = normalizeGroups(newGroups);
    setTempGalleryItemsState(newGroups);
    setIsDirty(true);
    setIsLayoutDirty(true);
  };

  // Observation/Academy Files States
  const [observationState, setObservationState] = useState<any[]>(() => {
    const saved = localStorage.getItem('observation_state_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return OBSERVATION_DATABASE;
  });
  const [observationIsGraduated, setObservationIsGraduated] = useState(false);
  const [tempObservationState, setTempObservationState] = useState<any[] | null>(null);
  const [editingCharId, setEditingCharId] = useState<number>(0);
  const [editingIsGraduated, setEditingIsGraduated] = useState<boolean>(false);
  const [showEditSelector, setShowEditSelector] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Trivia Persistent States
  const [triviaList, setTriviaList] = useState<string[]>(() => {
    const saved = localStorage.getItem('trivia_list_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return TRIVIA_DATABASE;
  });
  const [tempTriviaList, setTempTriviaList] = useState<string[] | null>(null);
  const [triviaDeck, setTriviaDeck] = useState<string[]>([]);

  // Supplement Persistent States
  const [supplementList, setSupplementList] = useState<any[]>(() => {
    const saved = localStorage.getItem('supplement_list_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      {
        category: "能量",
        title: "魔力增長規律",
        content: "魔力量並非固定不變，透過冥想與實戰可獲得穩定增長，但每個體質皆存在一個*「隱形上限值」*，一旦觸及上限，後續的開發難度將呈幾何級數上升。"
      },
      {
        category: "技術",
        title: "規模與精度",
        content: "*魔力量*直接影響魔法的影響範圍與物理威力；而*穩定性*則決定了魔法技術的細膩程度。魔力極高但穩定性極低者，容易造成魔力暴走。"
      },
      {
        category: "共生",
        title: "魔獸契合度",
        content: "魔獸與其主人的*擅長屬性*息息相關。屬性越接近，同步率（Sync Rate）越高，發揮出的複合魔法威力也越強。"
      },
      {
        category: "階級",
        title: "魔獸稀有度",
        content: "根據學院紀錄，*龍*為極稀有級別，*鳳凰*屬於稀有級別。相較之下，蝙蝠、蛇、曜隼與獨角獸等則在貴族階層中較為普遍。"
      }
    ];
  });
  const [tempSupplementList, setTempSupplementList] = useState<any[] | null>(null);
  const [editingSupplementIndex, setEditingSupplementIndex] = useState<number>(0);

  // Video Persistent States
  const [videoListState, setVideoListState] = useState<any[]>(() => {
    const saved = localStorage.getItem('video_list_v1');
    let list = null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = parsed;
        }
      } catch (e) {}
    }
    if (!list) {
      list = [
        {
          id: "ocean",
          title: "ocean",
          videoUrl: "https://raw.githubusercontent.com/albatron0523/my-illustrations/main/lv_0_20260118020351%20-%20Compressed%20with%20FlexClip.mp4",
          fileName: "lv_0_20260118020351 - Compressed with FlexClip.mp4",
          lyrics: [
            { time: 0, trans: "不公平", orig: "No fair" },
            { time: 6.88, trans: "你真的很懂得如何讓我流淚", orig: "You really know how to make me cry" },
            { time: 9.56, trans: "當你用那雙如海般的瞳孔注視著我", orig: "When you give me those ocean eyes" },
            { time: 13.38, trans: "我感到恐懼", orig: "I'm scared" },
            { time: 20.21, trans: "我不曾從如此高的地方墜落", orig: "I've never fallen from quite this high" },
            { time: 22.78, trans: "墜入", orig: "Fallin' into your" },
            { time: 24.06, trans: "你那深邃的眼眸", orig: "ocean eyes" },
            { time: 27.11, trans: "那雙如海般的眼睛", orig: "Those ocean eyes" }
          ]
        },
        {
          id: "moon",
          title: "moon",
          videoUrl: "https://raw.githubusercontent.com/albatron0523/my-illustrations/main/lv_0_20260529173450.mp4",
          fileName: "lv_0_20260529173450.mp4",
          lyrics: []
        }
      ];
    } else {
      // Ensure moon always has correct videoUrl
      list = list.map((v: any) => {
        if (v.id === 'moon' || v.title === 'moon') {
          return {
            ...v,
            videoUrl: "https://raw.githubusercontent.com/albatron0523/my-illustrations/main/lv_0_20260529173450.mp4",
            fileName: "lv_0_20260529173450.mp4"
          };
        }
        return v;
      });
    }
    return list;
  });
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [tempVideoList, setTempVideoList] = useState<any[] | null>(null);
  const [editingVideoIndex, setEditingVideoIndex] = useState<number>(0);

  // Characters State
  const [charactersState, setCharactersState] = useState<any>(() => {
    const saved = localStorage.getItem('characters_state_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      eleanora: {
        name: "艾蕾諾菈·克雷瑟",
        imageUrl: "https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C855_20250528195215%20(1).png",
        sections: [
          {
            title: "基本資訊",
            items: [
              "性別：女 / 年齡：12歲 / 身高：148",
              "路西恩的聯姻對象"
            ]
          },
          {
            title: "外貌與穿著",
            items: [
              "紫羅蘭色長髮+靛藍色瞳眸，如人偶般精緻",
              "常綁公主頭配大蝴蝶結，佩戴寶石項鍊(母親送給自己的禮物）"
            ]
          },
          {
            title: "個性特質",
            items: [
              "寡言/少笑，認為兩種行為都耗能量\n通常講話字數都偏少，大部分回覆以點頭搖頭代替",
              "智商超群，魔法資質高，但並沒有要展露頭角的想法",
              "洞悉惡意卻反應薄弱，帶點天然呆屬性"
            ]
          }
        ]
      },
      lucien: {
        name: "路西恩・法雷盟",
        imageUrl: "https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C855_20250528195215.png",
        sections: [
          {
            title: "基本資訊",
            items: [
              "性別：男 / 年齡：12歲 / 身高：161",
              "艾蕾諾菈的聯姻對象"
            ]
          },
          {
            title: "外貌與穿著",
            items: [
              "白短髮+不對稱鬢髮，金黃色雙瞳",
              "戴黑十字架耳環與白手套"
            ]
          },
          {
            title: "個性特質",
            items: [
              "因長期受法雷盟伯爵與伯爵夫人虐待，養成腹黑屬性\n常掛紳士笑容，實則擅長暗諷",
              "智商偏高，有操盤政治的潛質，但目前心智不成熟，面對超出預想範圍的事較容易慌亂",
              "內在敏感脆弱的傲嬌少年，面對心上人易害羞。"
            ]
          }
        ]
      },
      others: [
        {
          avatarUrl: "https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C886_20250618214443.png",
          name: "米蕾優·布朗雪",
          descriptions: [
            "艾蕾諾菈的貼身女僕",
            "溫和且是少數能讀懂艾蕾諾菈心意的人",
            "過去是在農村成長的平民，力氣頗大也擅長家事"
          ]
        },
        {
          avatarUrl: "https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C913_20250708151336.png",
          name: "莉雪·瑟蘭",
          descriptions: [
            "瑟蘭侯爵千金",
            "家族長年與克雷瑟家不對付，並有野心吞噬對方",
            "因家教+心儀路西恩對艾蕾諾菈心生嫉恨",
            "擅長社交而擁有不少人脈"
          ]
        },
        {
          avatarUrl: "",
          name: "席恩·法雷盟",
          descriptions: [
            "路西恩的表哥",
            "被父母寵溺+寄予厚望，養成粗俗又自卑的個性，相比路西恩像還沒社會化的小孩",
            "嫉妒路西恩所擁有的聲望與能力"
          ]
        },
        {
          avatarUrl: "https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C915_20260109111842.png",
          name: "艾洛蒂·拉維捏",
          descriptions: [
            "瓦爾托梅爾的公爵千金",
            "艾蕾諾菈的筆友，在學院與她第一次見面並迅速成為常常互動的朋友",
            "率真靈活，擅長引導他人走出傷痛"
          ]
        },
        {
          avatarUrl: "",
          name: "伊維爾·艾凡",
          descriptions: [
            "魔法學院的校長，古老神話「奧雷菲斯・維洛恩」的後裔，有其遺物",
            "小男孩，舉止跳脫古怪，常被誤會是一年級新生",
            "魔法實力強大到足以滅國，被譽為「神之子」",
            "據說是前校長去世前強推上位的，各國國王其實都怒不敢言"
          ]
        },
        {
          avatarUrl: "",
          name: "卡修斯·塞西爾",
          descriptions: [
            "希鷺倫的二王子",
            "有野心並堅信自己未來會成為這個國家的國王",
            "是真的會對自己的人民與政策有所行動，例如：提前制定社福政策、保護素未謀面的人民",
            "喜歡艾蕾諾菈，並在明知她已訂婚的情況下試圖拉近距離。\n其實他只是認為艾蕾諾菈適合當王妃，但不自知那不是真的愛。"
          ]
        },
        {
          avatarUrl: "",
          name: "奧斯丁·費雪",
          descriptions: [
            "伊維爾的管家，現多處理學校行政事物",
            "原本生活順遂、自命不凡，因此看不起表現不出色的人，並對學生嚴厲，直到被剝奪貴族地位後，才在平民村落見識何為「人間」，再之後被伊維爾僱用"
          ]
        },
        {
          avatarUrl: "",
          name: "管理者",
          descriptions: [
            "類似於世界神明的存在，但非必要不會回應「禱告」等儀式",
            "沒有感情，但會尊重人類的倫理道德",
            "本體無實體，因化作人形與人類溝通有利故幻化成神寵想變成的樣子",
            "會在人間挑選「神祭」協助管理世界"
          ]
        }
      ]
    };
  });

  useEffect(() => {
    localStorage.setItem('characters_state_v1', JSON.stringify(charactersState));
  }, [charactersState]);

  useEffect(() => {
    localStorage.setItem('observation_state_v1', JSON.stringify(observationState));
  }, [observationState]);

  const [tempCharIntroState, setTempCharIntroState] = useState<any>(null);
  const [charIntroEditorTab, setCharIntroEditorTab] = useState<'eleanora' | 'lucien' | 'others'>('eleanora');

  // Editor Sub-states and Persistent States
  const [editorTab, setEditorTab] = useState<'worldview' | 'countries' | 'families'>('worldview');
  const [showAddDropdown, setShowAddDropdown] = useState(false);

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedType, setDraggedType] = useState<'worldview' | 'country' | 'family' | 'description' | null>(null);
  const [draggedParentId, setDraggedParentId] = useState<string | null>(null);
  const [draggedDescriptionIndex, setDraggedDescriptionIndex] = useState<number | null>(null);

  // Wiki Data
  const [wikiData, setWikiData] = useState(() => {
    const saved = localStorage.getItem('wiki_data_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      worldview: [
        "科技、階級、禮儀與普遍思想道德與中世紀歐洲相似，但仍有捏造成分",
        "擁有魔法系統，黑市有蠻多魔藥與禁書的交易",
        "魔法的原理是透過魔力操縱原子移動，但世人們並不知道「原子」的概念",
        "黑魔法為操縱生物細胞（尤其神經細胞）的魔法，但這些魔法的使用途徑如果有經過法律認證的話就是合法的普通魔法（有點像是嗎啡能當麻醉也能當毒品的概念）",
        "為避免幼兒不會控制魔力時就對生物使用魔力，所以嬰兒出生時都會施加魔法加以限制"
      ],
      countries: [
        {
          id: "c-1",
          name: "希鷺倫",
          englishName: "Silerune",
          descriptions: [
            "北方強國，坐擁豐富礦產，因此工業發達",
            "將「水」視為信仰，當作與上帝溝通的渠道，秋季的豐收季時會舉辦慶典「潤恩節」，皇帝會邀請水系魔法師上台表演，民間也會有大量的攤販舉國歡慶",
            "有北方聖地「艾爾哈爾達（Eirhalda）」，氣候雖寒冷但仍有許多人來朝盛"
          ]
        },
        {
          id: "c-2",
          name: "瓦爾托梅爾",
          englishName: "Valtomere",
          descriptions: [
            "南方強國，因氣候溫暖盛產農產",
            "內鬥頻繁，治安不穩，黑魔法師較多"
          ]
        }
      ],
      families: [
        {
          id: "f-1",
          name: "克雷瑟家族",
          englishName: "Cressel",
          descriptions: [
            "地位：公爵",
            "財力雄厚，領地大，多掌控北方領土",
            "公爵雷納德寵妻女但政治殺伐果斷，夫人長年臥病，僅有一女"
          ]
        },
        {
          id: "f-2",
          name: "法雷蒙家族",
          englishName: "Valemont",
          descriptions: [
            "地位：伯爵",
            "前伯爵傑羅得犧牲，遺孤路西恩被現伯爵艾多里安收養",
            "養父母憎恨其光環，將路西恩訓練成完美少爺"
          ]
        },
        {
          id: "f-3",
          name: "瑟蘭家族",
          englishName: "Seranne",
          descriptions: [
            "地位：侯爵",
            "與克雷瑟家為世仇，有野心吞併克雷瑟家",
            "重男輕女，重視利益與子女的禮儀規矩"
          ]
        },
        {
          id: "f-4",
          name: "賽西爾家族",
          englishName: "Cecil",
          descriptions: [
            "地位：王族",
            "歷史悠久的家族，已掌控希鷺倫數百年",
            "魔力血統極純，後代通常都有高魔力",
            "目前國王育有二位王子，大王子派與二王子派的貴族們私下爭執不斷"
          ]
        },
        {
          id: "f-5",
          name: "拉維涅家族",
          englishName: "Ravigny",
          descriptions: [
            "地位：公爵(瓦爾托梅爾)",
            "拉維涅夫婦在該國以親切聞名，也寵家裡的兄妹檔",
            "重視家庭環境與孩子的眼界，不論多忙都會抽空帶小孩出去玩"
          ]
        }
      ]
    };
  });

  useEffect(() => {
    localStorage.setItem('wiki_data_v1', JSON.stringify(wikiData));
  }, [wikiData]);

  useEffect(() => {
    localStorage.setItem('trivia_list_v1', JSON.stringify(triviaList));
  }, [triviaList]);

  useEffect(() => {
    localStorage.setItem('supplement_list_v1', JSON.stringify(supplementList));
  }, [supplementList]);

  useEffect(() => {
    localStorage.setItem('video_list_v1', JSON.stringify(videoListState));
  }, [videoListState]);

  // Chapters State
  const [chaptersState, setChaptersState] = useState(() => {
    const saved = localStorage.getItem('chapters_state_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((ch: any, idx: number) => {
          if (!ch.subTitle) {
            let sub = "";
            if (ch.title === "序章") sub = "未婚夫";
            else if (ch.title === "第一章") sub = "圖書館";
            else if (ch.title === "第二章") sub = "茶會準備";
            return { ...ch, subTitle: sub };
          }
          return ch;
        });
      } catch (e) {}
    }
    return INITIAL_CHAPTERS.map((ch, idx) => {
      let sub = "";
      if (idx === 0) sub = "未婚夫";
      else if (idx === 1) sub = "圖書館";
      else if (idx === 2) sub = "茶會準備";
      return { ...ch, subTitle: sub };
    });
  });

  useEffect(() => {
    localStorage.setItem('chapters_state_v1', JSON.stringify(chaptersState));
  }, [chaptersState]);

  useEffect(() => {
    localStorage.setItem('player_config_v1', JSON.stringify(playerConfig));
  }, [playerConfig]);

  useEffect(() => {
    localStorage.setItem('preface_config_v1', JSON.stringify(prefaceConfig));
  }, [prefaceConfig]);

  useEffect(() => {
    localStorage.setItem('timer_target_date_v1', targetDateStr);
  }, [targetDateStr]);

  // Override top level getArtInfo if we want inside App component context
  const getArtInfo = (url: string) => {
    const filename = decodeURIComponent(url.split('/').pop() || '');
    return artMetadataState[filename] || { title: '未知作品', date: '未知', artist: '未知' };
  };

  // Populate temp states when editing sections are opened
  useEffect(() => {
    if (activeEditSection === '世界觀') {
      setTempWikiData(JSON.parse(JSON.stringify(wikiData)));
      setIsDirty(false);
    } else if (activeEditSection === '列表') {
      setTempChaptersState(JSON.parse(JSON.stringify(chaptersState)));
      setIsDirty(false);
    } else if (activeEditSection === '文章內容') {
      setTempChaptersState(JSON.parse(JSON.stringify(chaptersState)));
      if (editingChapterIndex !== null && chaptersState[editingChapterIndex]) {
        setTempChapterContentText(htmlToPlainText(chaptersState[editingChapterIndex].content || ""));
      } else {
        setTempChapterContentText("");
      }
      setIsDirty(false);
    } else if (activeEditSection === '畫廊') {
      setTempArtMetadataState(JSON.parse(JSON.stringify(artMetadataState)));
      if (!tempGalleryItemsState || tempGalleryItemsState.length === 0) {
        setTempGalleryItemsState(JSON.parse(JSON.stringify(galleryItemsState)));
      }
      setTempGalleryTitle(galleryTitle);
      if (!isLayoutDirty) {
        setIsDirty(false);
      }
    } else if (activeEditSection === '音樂播放器') {
      setTempPlayerConfig({ ...playerConfig });
      setIsDirty(false);
    } else if (activeEditSection === '序言') {
      setTempPrefaceConfig({ ...prefaceConfig });
      setIsDirty(false);
    } else if (activeEditSection === '計時器') {
      setTempTargetDateStr(targetDateStr);
      setIsDirty(false);
    } else if (activeEditSection === '角色介紹') {
      setTempCharIntroState(JSON.parse(JSON.stringify(charactersState)));
      setIsDirty(false);
    } else if (activeEditSection === '學院檔案') {
      setTempObservationState(JSON.parse(JSON.stringify(observationState)));
      setEditingCharId(randomCharId);
      setEditingIsGraduated(observationIsGraduated);
      setIsDirty(false);
    } else if (activeEditSection === '角色趣聞') {
      setTempTriviaList([...triviaList]);
      setIsDirty(false);
    } else if (activeEditSection === '檔案資訊補充') {
      setTempSupplementList(JSON.parse(JSON.stringify(supplementList)));
      setEditingSupplementIndex(0);
      setIsDirty(false);
    } else if (activeEditSection === '文章影片播放器') {
      setTempVideoList(JSON.parse(JSON.stringify(videoListState)));
      setEditingVideoIndex(activeVideoIndex);
      setIsDirty(false);
    } else {
      setIsDirty(false);
    }
    setShowExitConfirm(false);
  }, [activeEditSection]);

  const handleCloseRequest = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      setActiveEditSection(null);
    }
  };

  const handleSaveWorldview = () => {
    if (!tempWikiData) return;
    const cleanedCountries = tempWikiData.countries.map((c: any) => ({
      ...c,
      descriptions: c.descriptions.filter((d: string) => d.trim() !== "")
    }));
    const cleanedFamilies = tempWikiData.families.map((f: any) => ({
      ...f,
      descriptions: f.descriptions.filter((d: string) => d.trim() !== "")
    }));
    const finalWiki = {
      ...tempWikiData,
      countries: cleanedCountries,
      families: cleanedFamilies
    };
    setWikiData(finalWiki);
    saveFieldToFirebase('wikiData', finalWiki);
    setIsDirty(false);
    setActiveEditSection(null);
  };

  const handleSaveChapters = () => {
    setChaptersState(tempChaptersState);
    saveFieldToFirebase('chaptersState', tempChaptersState);
    setIsDirty(false);
    setActiveEditSection(null);
  };

  const handleSaveChapterContent = () => {
    if (editingChapterIndex !== null) {
      const updated = [...tempChaptersState];
      updated[editingChapterIndex].content = plainTextToHtml(tempChapterContentText);
      setChaptersState(updated);
      saveFieldToFirebase('chaptersState', updated);
      setIsDirty(false);
      setActiveEditSection(null);
    }
  };

  const handleSaveGalleryLayout = () => {
    const updatedLayout = JSON.parse(JSON.stringify(tempGalleryItemsState));
    setGalleryItemsState(updatedLayout);
    saveFieldToFirebase('galleryItemsState', updatedLayout);
    setIsLayoutDirty(false);
    setIsDirty(false);
  };

  const handleTabChange = (targetTab: string) => {
    if (activeTab === 'art' && isEditMode && isLayoutDirty) {
      if (!window.confirm("您有未儲存的畫廊變更（圖片大小或位置），確定要離開嗎？")) {
        return;
      }
      setTempGalleryItemsState(JSON.parse(JSON.stringify(galleryItemsState)));
      setIsLayoutDirty(false);
      setIsDirty(false);
    }
    setActiveTab(targetTab);
    setIsSidebarOpen(false);
  };

  const handleSaveArtMetadata = () => {
    const validation = validateGalleryLayout(tempGalleryItemsState, tempArtMetadataState);
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    // Filter out deleted items from old permanent galleryItemsState
    const tempUrls = new Set<string>();
    tempGalleryItemsState.forEach((g: any) => {
      g.rows?.forEach((r: any) => {
        r.items?.forEach((it: any) => {
          if (it.url) tempUrls.add(it.url);
        });
      });
    });

    // Remove deleted items from existing permanent layout
    let updatedPermanent = JSON.parse(JSON.stringify(galleryItemsState));
    updatedPermanent.forEach((g: any) => {
      g.rows?.forEach((r: any) => {
        r.items = r.items?.filter((it: any) => tempUrls.has(it.url)) || [];
      });
      g.rows = g.rows?.filter((r: any) => r.items.length > 0) || [];
    });
    updatedPermanent = updatedPermanent.filter((g: any) => g.rows && g.rows.length > 0);

    // Find newly added items from tempGalleryItemsState and append them to updatedPermanent
    const permanentUrls = new Set<string>();
    updatedPermanent.forEach((g: any) => {
      g.rows?.forEach((r: any) => {
        r.items?.forEach((it: any) => {
          if (it.url) permanentUrls.add(it.url);
        });
      });
    });

    // Traverse tempGalleryItemsState and append groups that contain new URLs
    tempGalleryItemsState.forEach((g: any) => {
      const hasNewItem = g.rows?.some((r: any) => r.items?.some((it: any) => !permanentUrls.has(it.url)));
      if (hasNewItem) {
        const newGroup = JSON.parse(JSON.stringify(g));
        newGroup.rows?.forEach((r: any) => {
          r.items = r.items?.filter((it: any) => !permanentUrls.has(it.url)) || [];
        });
        newGroup.rows = newGroup.rows?.filter((r: any) => r.items.length > 0) || [];
        if (newGroup.rows && newGroup.rows.length > 0) {
          updatedPermanent.push(newGroup);
        }
      }
    });

    updatedPermanent = normalizeGroups(updatedPermanent);

    setArtMetadataState(tempArtMetadataState);
    setGalleryItemsState(updatedPermanent);
    setGalleryTitle(tempGalleryTitle);
    saveFieldToFirebase('artMetadataState', tempArtMetadataState);
    saveFieldToFirebase('galleryItemsState', updatedPermanent);
    saveFieldToFirebase('galleryTitle', tempGalleryTitle);

    if (!isLayoutDirty) {
      setIsDirty(false);
    }
    setActiveEditSection(null);
  };

  const handleSaveCharacterIntro = () => {
    if (!tempCharIntroState) return;
    setCharactersState(tempCharIntroState);
    saveFieldToFirebase('charactersState', tempCharIntroState);
    setIsDirty(false);
    setActiveEditSection(null);
  };

  const handleSaveObservation = () => {
    if (!tempObservationState) return;
    setObservationState(tempObservationState);
    saveFieldToFirebase('observationState', tempObservationState);
    setRandomCharId(editingCharId);
    setObservationIsGraduated(editingIsGraduated);
    setIsDirty(false);
    setActiveEditSection(null);
  };

  const handleSaveTrivia = () => {
    if (!tempTriviaList) return;
    setTriviaList(tempTriviaList);
    saveFieldToFirebase('triviaList', tempTriviaList);
    setIsDirty(false);
    setActiveEditSection(null);
  };

  const handleSaveSupplement = () => {
    if (!tempSupplementList) return;
    setSupplementList(tempSupplementList);
    saveFieldToFirebase('supplementList', tempSupplementList);
    setIsDirty(false);
    setActiveEditSection(null);
  };

  const handleSaveVideoList = () => {
    if (!tempVideoList) return;
    setVideoListState(tempVideoList);
    saveFieldToFirebase('videoListState', tempVideoList);
    setIsDirty(false);
    setActiveEditSection(null);
  };

  // Drag and drop handlers
  const handleDragStartWorldview = (idx: number) => {
    setDraggedIndex(idx);
    setDraggedType('worldview');
  };

  const handleDragOverWorldview = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedType !== 'worldview' || draggedIndex === null || draggedIndex === idx) return;
    const items = [...tempWikiData.worldview];
    const temp = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(idx, 0, temp);
    setDraggedIndex(idx);
    setTempWikiData({ ...tempWikiData, worldview: items });
    setIsDirty(true);
  };

  const handleDragStartCountry = (idx: number) => {
    setDraggedIndex(idx);
    setDraggedType('country');
  };

  const handleDragOverCountry = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedType !== 'country' || draggedIndex === null || draggedIndex === idx) return;
    const items = [...tempWikiData.countries];
    const temp = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(idx, 0, temp);
    setDraggedIndex(idx);
    setTempWikiData({ ...tempWikiData, countries: items });
    setIsDirty(true);
  };

  const handleDragStartFamily = (idx: number) => {
    setDraggedIndex(idx);
    setDraggedType('family');
  };

  const handleDragOverFamily = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedType !== 'family' || draggedIndex === null || draggedIndex === idx) return;
    const items = [...tempWikiData.families];
    const temp = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(idx, 0, temp);
    setDraggedIndex(idx);
    setTempWikiData({ ...tempWikiData, families: items });
    setIsDirty(true);
  };

  const handleDragStartDescription = (parentId: string, descIdx: number) => {
    setDraggedParentId(parentId);
    setDraggedDescriptionIndex(descIdx);
    setDraggedType('description');
  };

  const handleDragOverDescription = (e: React.DragEvent, parentId: string, descIdx: number) => {
    e.preventDefault();
    if (draggedType !== 'description' || draggedParentId !== parentId || draggedDescriptionIndex === null || draggedDescriptionIndex === descIdx) return;
    
    // Check if it's a country or family
    const isCountry = parentId.startsWith('c-');
    if (isCountry) {
      const cIdx = tempWikiData.countries.findIndex(c => c.id === parentId);
      if (cIdx === -1) return;
      const descs = [...tempWikiData.countries[cIdx].descriptions];
      const temp = descs[draggedDescriptionIndex];
      descs.splice(draggedDescriptionIndex, 1);
      descs.splice(descIdx, 0, temp);
      const updatedCountries = [...tempWikiData.countries];
      updatedCountries[cIdx].descriptions = descs;
      setDraggedDescriptionIndex(descIdx);
      setTempWikiData({ ...tempWikiData, countries: updatedCountries });
    } else {
      const fIdx = tempWikiData.families.findIndex(f => f.id === parentId);
      if (fIdx === -1) return;
      const descs = [...tempWikiData.families[fIdx].descriptions];
      const temp = descs[draggedDescriptionIndex];
      descs.splice(draggedDescriptionIndex, 1);
      descs.splice(descIdx, 0, temp);
      const updatedFamilies = [...tempWikiData.families];
      updatedFamilies[fIdx].descriptions = descs;
      setDraggedDescriptionIndex(descIdx);
      setTempWikiData({ ...tempWikiData, families: updatedFamilies });
    }
    setIsDirty(true);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '990523') {
      setIsEditMode(true);
      setShowPasswordModal(false);
      setPasswordInput('');
      setPasswordError(null);
    } else {
      setPasswordError('密碼錯誤！請重新輸入。');
    }
  };

  const handleAddSourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName.trim()) {
      setNewSourceError("請輸入名稱");
      return;
    }
    if (!newSourceUrl.trim()) {
      setNewSourceError("請輸入網址");
      return;
    }
    let url = newSourceUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    
    const updatedSources = [...sources, { name: newSourceName.trim(), url }];
    setSources(updatedSources);
    saveFieldToFirebase('sources', updatedSources);
    setShowAddSourceModal(false);
    setNewSourceName('');
    setNewSourceUrl('');
    setNewSourceError(null);
  };

  const audioRef = useRef<HTMLAudioElement>(null);
  const charScrollAreaRef = useRef<HTMLDivElement>(null);

  // Scroll to top when switching tabs
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Reset character scroll area position to top when character tab changes
  useEffect(() => {
    if (charScrollAreaRef.current) {
      charScrollAreaRef.current.scrollTop = 0;
    }
  }, [charTab]);

  // Initialize random character and trivia
  useEffect(() => {
    const allIds = observationState.map(c => c.id);
    const randomId = allIds[Math.floor(Math.random() * allIds.length)];
    setRandomCharId(randomId);
    setSeenCharIds([randomId]);
    
    if (triviaList && triviaList.length > 0) {
      const randomIndex = Math.floor(Math.random() * triviaList.length);
      const randomTrivia = triviaList[randomIndex];
      setCurrentTrivia(randomTrivia);
      setTriviaRotation(Number((Math.random() * 4 - 2).toFixed(1)));
      setTriviaDeck(triviaList.filter((_, i) => i !== randomIndex));
    }
  }, []);

  useEffect(() => {
    if (triviaList && triviaList.length > 0) {
      if (!triviaList.includes(currentTrivia)) {
        setCurrentTrivia(triviaList[0]);
      }
    } else {
      setCurrentTrivia("");
    }
  }, [triviaList, currentTrivia]);

  const shuffleTrivia = () => {
    if (!triviaList || triviaList.length === 0) return;
    let currentDeck = [...triviaDeck];
    const validDeck = currentDeck.filter(item => triviaList.includes(item));
    
    if (validDeck.length === 0) {
      let items = [...triviaList];
      if (items.length > 1 && currentTrivia) {
        items = items.filter(item => item !== currentTrivia);
      }
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
      const chosen = items.pop();
      setTriviaDeck(items);
      if (chosen) {
        setCurrentTrivia(chosen);
        setTriviaRotation(Number((Math.random() * 4 - 2).toFixed(1)));
      }
    } else {
      const idx = Math.floor(Math.random() * validDeck.length);
      const chosen = validDeck[idx];
      const newDeck = validDeck.filter((_, i) => i !== idx);
      setTriviaDeck(newDeck);
      setCurrentTrivia(chosen);
      setTriviaRotation(Number((Math.random() * 4 - 2).toFixed(1)));
    }
  };

  const handleSelectChar = (id: number) => {
    setRandomCharId(id);
    if (!seenCharIds.includes(id)) {
      setSeenCharIds([...seenCharIds, id]);
    }
  };

  const shuffleChar = () => {
    const allIds = observationState.map(c => c.id);
    const remainingIds = allIds.filter(id => !seenCharIds.includes(id));
    
    if (remainingIds.length === 0) {
      // All characters seen, reset pool but avoid immediate repeat if possible
      const resetIds = allIds.filter(id => id !== randomCharId);
      const nextId = resetIds[Math.floor(Math.random() * resetIds.length)];
      setRandomCharId(nextId);
      setSeenCharIds([nextId]);
    } else {
      const nextId = remainingIds[Math.floor(Math.random() * remainingIds.length)];
      setRandomCharId(nextId);
      setSeenCharIds([...seenCharIds, nextId]);
    }
  };

  // Timer Logic
  useEffect(() => {
    if (activeTab === 'char') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  useEffect(() => {
    const updateTimer = () => {
      try {
        const parts = targetDateStr.split('/');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const targetDate = new Date(year, month, day);
          if (!isNaN(targetDate.getTime())) {
            const diff = new Date().getTime() - targetDate.getTime();
            const absDiff = Math.abs(diff);
            const d = Math.floor(absDiff / 86400000);
            const h = Math.floor((absDiff / 3600000) % 24);
            const m = Math.floor((absDiff / 60000) % 60);
            const s = Math.floor((absDiff / 1000) % 60);
            setTimer(`${d} Days ${h} Hours ${m} Mins ${s} Secs`);
            return;
          }
        }
      } catch (e) {
        console.error(e);
      }
      setTimer("00 Days 00 Hours 00 Mins 00 Secs");
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetDateStr]);

  // Audio Prefetch Logic
  useEffect(() => {
    let isMounted = true;
    const AUDIO_SRC = playerConfig.audioUrl;
    
    // If it's already a blob/data URL, use it directly
    if (AUDIO_SRC.startsWith('blob:') || AUDIO_SRC.startsWith('data:')) {
      setAudioBlobUrl(AUDIO_SRC);
      setAudioLoadProgress(100);
      return;
    }

    const prefetchAudio = async () => {
      try {
        setAudioLoadProgress(1);
        const response = await fetch(AUDIO_SRC);
        if (!response.ok) throw new Error("Network response was not ok");
        
        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        let loaded = 0;

        const reader = response.body?.getReader();
        if (!reader) throw new Error("ReadableStream not supported");

        const chunks: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            loaded += value.length;
            if (total > 0) {
              setAudioLoadProgress((loaded / total) * 100);
            }
          }
        }

        if (isMounted) {
          const blob = new Blob(chunks, { type: 'audio/mpeg' });
          const url = URL.createObjectURL(blob);
          setAudioBlobUrl(url);
          setAudioLoadProgress(100);
        }
      } catch (err) {
        console.error("Audio prefetch failed:", err);
        // Fallback to direct URL if prefetch fails
        if (isMounted) {
          setAudioBlobUrl(AUDIO_SRC);
          setAudioLoadProgress(100);
        }
      }
    };

    prefetchAudio();

    return () => {
      isMounted = false;
      if (audioBlobUrl && audioBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioBlobUrl);
      }
    };
  }, [playerConfig.audioUrl]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Audio Logic
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 1.0;
      if (isPlaying) {
        // Boost volume with Web Audio API beyond the 1.0 limit
        if (!audioContextRef.current) {
          try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContextClass();
            const source = ctx.createMediaElementSource(audioRef.current);
            const gainNode = ctx.createGain();
            // Scale by playerConfig.volume
            gainNode.gain.value = (playerConfig.volume / 100) * 3.5;
            source.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            audioContextRef.current = ctx;
            gainNodeRef.current = gainNode;
          } catch (e) {
            console.error("Failed to setup Web Audio booster:", e);
          }
        } else if (gainNodeRef.current) {
          // Update volume of already-running gainNode
          gainNodeRef.current.gain.value = (playerConfig.volume / 100) * 3.5;
        }
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, audioBlobUrl]);

  // React to volume changes immediately
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = (playerConfig.volume / 100) * 3.5;
    }
  }, [playerConfig.volume]);

  const togglePlay = () => {
    if (audioLoadProgress < 10) return;
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(pct);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = pct * audioRef.current.duration;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-[9998]"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div 
        id="sidebar"
        initial={{ left: -260 }}
        animate={{ left: isSidebarOpen ? 0 : -260 }}
        className={`fixed top-0 w-[240px] h-full bg-white z-[9999] shadow-2xl pt-20 ${isSidebarOpen ? 'active' : ''}`}
      >
        <ul className="sidebar-menu">
          <li className={`nav-item ${activeTab === 'home' ? 'active-nav' : ''}`} onClick={() => handleTabChange('home')}>HOME</li>
          <li className={`nav-item ${activeTab === 'char' ? 'active-nav' : ''}`} onClick={() => handleTabChange('char')}>CHARACTERS</li>
          <li className={`nav-item ${activeTab === 'library' ? 'active-nav' : ''}`} onClick={() => handleTabChange('library')}>LIBRARY</li>
          <li className={`nav-item ${activeTab === 'art' ? 'active-nav' : ''}`} onClick={() => handleTabChange('art')}>GALLERY</li>
        </ul>
      </motion.div>

      {/* Menu Button */}
      <div id="menuBtn" onClick={() => setIsSidebarOpen(true)}>
        <div></div><div></div><div></div>
      </div>

      {/* Main Content */}
      <main className="w-full">
        {/* Background Music Audio (Always rendered for persistence) */}
        <audio 
          ref={audioRef}
          src={audioBlobUrl || undefined} 
          loop 
          onTimeUpdate={handleTimeUpdate}
        />

        {/* Tab: Home */}
        {activeTab === 'home' && (
          <div className="sub-page active">
            <div className="top-content">
              <div className={`player-container relative ${isPlaying ? 'playing' : ''}`} id="player">
                {isEditMode && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveEditSection('音樂播放器'); }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#bdbade] hover:bg-[#8a7f9c] flex items-center justify-center text-white text-[10px] font-bold shadow-sm z-[100] transition-colors cursor-pointer"
                  >
                    ✎
                  </button>
                )}
                <div className="record-box">
                  <div className="record">
                    <div className="record-img" style={{ backgroundImage: playerConfig.imageUrl ? `url(${playerConfig.imageUrl})` : undefined }}></div>
                  </div>
                </div>
                <div className="info-side">
                  <div className="font-bold text-[#8a7f9c] text-sm mb-1">
                    《 {playerConfig.title} 》
                  </div>
                  <div className="progress-wrapper" onClick={seek}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                  <div className="controls">
                    <div className="btn" onClick={() => audioRef.current && (audioRef.current.currentTime -= 10)}><SkipBack size={18} /></div>
                    <div className={`btn ${audioLoadProgress < 10 ? 'opacity-30 cursor-not-allowed' : ''}`} onClick={togglePlay}>
                      {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                    </div>
                    <div className="btn" onClick={() => audioRef.current && (audioRef.current.currentTime += 10)}><SkipForward size={18} /></div>
                    <div className="btn" onClick={() => audioRef.current && (audioRef.current.currentTime = 0)}><RotateCcw size={18} /></div>
                  </div>
                </div>
              </div>

              <div className={`intro-section relative ${isEditMode ? 'ring-2 ring-purple-400 ring-dashed p-4 rounded-lg' : ''}`}>
                {isEditMode && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveEditSection('序言'); }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#bdbade] hover:bg-[#8a7f9c] flex items-center justify-center text-white text-[10px] font-bold shadow-sm z-[100] transition-colors cursor-pointer"
                  >
                    ✎
                  </button>
                )}
                <div
                  className={`line line-1 ${isEditMode ? 'bg-purple-50/50 outline-none cursor-text' : ''}`}
                  contentEditable={isEditMode}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => {
                    const line1 = e.currentTarget.textContent || "";
                    setPrefaceConfig(prev => ({ ...prev, line1 }));
                    saveFieldToFirebase('line1', line1);
                  }}
                >
                  {prefaceConfig.line1}
                </div>
                <div
                  className={`line line-2 ${isEditMode ? 'bg-purple-50/50 outline-none cursor-text' : ''}`}
                  contentEditable={isEditMode}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => {
                    const line2 = e.currentTarget.textContent || "";
                    setPrefaceConfig(prev => ({ ...prev, line2 }));
                    saveFieldToFirebase('line2', line2);
                  }}
                >
                  {prefaceConfig.line2}
                </div>
              </div>

              <div className={`timer-section relative ${isEditMode ? 'ring-2 ring-purple-400 ring-dashed p-4 rounded-lg' : ''}`}>
                {isEditMode && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveEditSection('計時器'); }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#bdbade] hover:bg-[#8a7f9c] flex items-center justify-center text-white text-[10px] font-bold shadow-sm z-[100] transition-colors cursor-pointer"
                  >
                    ✎
                  </button>
                )}
                <div
                  className={`timer-label ${isEditMode ? 'bg-purple-50/50 outline-none cursor-text px-2' : ''}`}
                  contentEditable={isEditMode}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => {
                    const label = e.currentTarget.textContent || "";
                    setTimerLabel(label);
                    saveFieldToFirebase('timerLabel', label);
                  }}
                >
                  {timerLabel}
                </div>
                {timer}
              </div>

              <div className="wiki-section relative">
                {isEditMode && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveEditSection('世界觀'); }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#bdbade] hover:bg-[#8a7f9c] flex items-center justify-center text-white text-[10px] font-bold shadow-sm z-[100] transition-colors cursor-pointer"
                  >
                    ✎
                  </button>
                )}
                <div className="tabs">
                  <div className={`tab-btn ${wikiTab === 'w1' ? 'active' : ''}`} onClick={() => setWikiTab('w1')}>✧༺ 世界觀 ༻✧</div>
                  <div className={`tab-btn ${wikiTab === 'w2' ? 'active' : ''}`} onClick={() => setWikiTab('w2')}>✧˖° 國家</div>
                  <div className={`tab-btn ${wikiTab === 'w3' ? 'active' : ''}`} onClick={() => setWikiTab('w3')}>✧˖° 家族</div>
                </div>
                <div className="wiki-content-area">
                  {wikiTab === 'w1' && (
                    <div className="content-pane active text-left">
                      <h3>✧ 核心設定</h3>
                      {wikiData.worldview.map((item, idx) => (
                        <div key={idx} className="mb-2">✦ {item}</div>
                      ))}
                    </div>
                  )}
                  {wikiTab === 'w2' && (
                    <div className="content-pane active text-left">
                      {wikiData.countries.map((country, idx) => (
                        <div key={country.id || idx} className="mb-4">
                          <h3>✧ {country.name} ({country.englishName})</h3>
                          {country.descriptions.map((desc, dIdx) => (
                            <div key={dIdx} className="mb-2">✦ {desc}</div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  {wikiTab === 'w3' && (
                    <div className="content-pane active text-left">
                      {wikiData.families.map((family, idx) => (
                        <div key={family.id || idx} className="mb-4">
                          <h3>✧ {family.name} ({family.englishName})</h3>
                          {family.descriptions.map((desc, dIdx) => (
                            <div key={dIdx} className="mb-2">✦ {desc}</div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <section className="credits-container">
                <div className="credits-title flex justify-center items-center w-full">
                  <span>SOURCES 資料來源</span>
                </div>
                <div className="credits-buttons flex flex-wrap gap-2 items-center">
                  {sources.map((src, idx) => (
                    <div key={idx} className="relative inline-block">
                      <a href={src.url} target="_blank" rel="noopener noreferrer" className="credit-btn">
                        {src.name}
                      </a>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const updatedSources = sources.filter((_, i) => i !== idx);
                            setSources(updatedSources);
                            saveFieldToFirebase('sources', updatedSources);
                          }}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-[10px] font-bold z-10 cursor-pointer shadow transition-transform hover:scale-110"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {isEditMode && (
                    <button 
                      type="button"
                      onClick={() => {
                        setNewSourceName('');
                        setNewSourceUrl('');
                        setNewSourceError(null);
                        setShowAddSourceModal(true);
                      }} 
                      className="credit-btn cursor-pointer flex items-center justify-center font-bold text-sm bg-[#bdbade]/20"
                      title="新增資料來源"
                    >
                      +
                    </button>
                  )}
                  <button 
                    type="button"
                    onClick={() => {
                      if (isEditMode) {
                        setIsEditMode(false);
                      } else {
                        setShowPasswordModal(true);
                      }
                    }} 
                    className="credit-btn cursor-pointer"
                  >
                    key
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* Tab: Character */}
        {activeTab === 'char' && (
          <div className="sub-page active">
            <div className="top-content">
              <div className="char-container">
                <ObservationCard key={`${randomCharId}-${observationIsGraduated}`} charId={randomCharId} onSelectChar={handleSelectChar} isEditMode={isEditMode} onEdit={() => setActiveEditSection('學院檔案')} isGraduated={observationIsGraduated} setIsGraduated={setObservationIsGraduated} observationState={observationState} />
                <SettingSupplement 
                  isEditMode={isEditMode} 
                  onEdit={() => setActiveEditSection('檔案資訊補充')} 
                  supplementList={supplementList}
                  setSupplementList={setSupplementList}
                />
                <div className="char-nav">
                  <div className={`char-node ${charTab === 'c1' ? 'active' : ''}`} onClick={() => setCharTab('c1')}>ELEANORA</div>
                  <div className={`char-node ${charTab === 'c2' ? 'active' : ''}`} onClick={() => setCharTab('c2')}>LUCIEN</div>
                  <div className={`char-node ${charTab === 'c3' ? 'active' : ''}`} onClick={() => setCharTab('c3')}>OTHERS</div>
                </div>
                <div className="char-scroll-area relative" ref={charScrollAreaRef}>
                  {isEditMode && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveEditSection('角色介紹'); }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#bdbade] hover:bg-[#8a7f9c] flex items-center justify-center text-white text-[10px] font-bold shadow-sm z-[100] transition-colors cursor-pointer"
                    >
                      ✎
                    </button>
                  )}
                  {charTab === 'c1' && (
                    <div className="char-content active">
                      <div className="char-flex">
                        <div className="text-side">
                          <div className="char-title">艾蕾諾菈·克雷瑟</div>
                          
                          <span className="section-title">★ 基本資訊</span>
                          - 性別：女 / 年齡：12歲 / 身高：148<br />
                          - 路西恩的聯姻對象
                          <span className="section-title">★ 外貌與穿著</span>
                          ✦ 紫羅蘭色長髮+靛藍色瞳眸，如人偶般精緻<br />
                          ✦ 常綁公主頭配大蝴蝶結，佩戴寶石項鍊(母親送給自己的禮物）
                          <span className="section-title">★ 個性特質</span>
                          ✦ 寡言/少笑，認為兩種行為都耗能量<br />
                          通常講話字數都偏少，大部分回覆以點頭搖頭代替<br />
                          ✦ 智商超群，魔法資質高，但並沒有要展露頭角的想法<br />
                          ✦ 洞悉惡意卻反應薄弱，帶點天然呆屬性
                        </div>
                        <div className="img-side">
                          <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/無標題855_20250528195215 (1).png" alt="Eleanora" referrerPolicy="no-referrer" />
                        </div>
                      </div>
                    </div>
                  )}
                  {charTab === 'c2' && (
                    <div className="char-content active">
                      <div className="char-flex">
                        <div className="text-side">
                          <div className="char-title">路西恩・法雷蒙</div>
                          
                          <span className="section-title">★ 基本資訊</span>
                          - 性別：男 / 年齡：12歲 / 身高：161<br />
                          - 艾蕾諾菈的聯姻對象
                          <span className="section-title">★ 外貌與穿著</span>
                          ✦ 白短髮+不對稱鬢髮，金黃色雙瞳<br />
                          ✦ 戴黑十字架耳環與白手套
                          <span className="section-title">★ 個性特質</span>
                          ✦ 因長期受法雷蒙伯爵與伯爵夫人虐待，養成腹黑屬性<br />
                          常掛紳士笑容，實則擅長暗諷<br />
                          ✦ 智商偏高，有操盤政治的潛質，但目前心智不成熟，面對超出預想範圍的事較容易慌亂<br />
                          ✦ 內在敏感脆弱的傲嬌少年，面對心上人易害羞。
                        </div>
                        <div className="img-side">
                          <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/無標題855_20250528195215.png" alt="Lucien" referrerPolicy="no-referrer" />
                        </div>
                      </div>
                    </div>
                  )}
                  {charTab === 'c3' && (
                    <div className="char-content active">
                      <div className="support-item">
                        <div className="support-avatar">
                          <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/無標題886_20250618214443.png" alt="Mireille" referrerPolicy="no-referrer" />
                        </div>
                        <div className="support-info">
                          <div className="support-char-name">✧ 米蕾優·布朗雪</div>
                          <div className="support-desc">
                            ✦ 艾蕾諾菈的貼身女僕<br />
                            ✦ 溫和且是少數能讀懂艾蕾諾菈心意的人<br />
                            ✦ 過去是在農村成長的平民，力氣頗大也擅長家事
                          </div>
                        </div>
                      </div>

                      <div className="support-item">
                        <div className="support-avatar">
                          <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/無標題913_20250708151336.png" alt="Licia" referrerPolicy="no-referrer" />
                        </div>
                        <div className="support-info">
                          <div className="support-char-name">✧ 莉雪·瑟蘭</div>
                          <div className="support-desc">
                            ✦ 瑟蘭侯爵千金<br />
                            ✦ 家族長年與克雷瑟家不對付，並有野心吞噬對方<br />
                            ✦ 因家教+心儀路西恩對艾蕾諾菈心生嫉恨<br />
                            ✦ 擅長社交而擁有不少人脈
                          </div>
                        </div>
                      </div>

                      <div className="support-item">
                        <div className="support-avatar">席恩</div>
                        <div className="support-info">
                          <div className="support-char-name">✧ 席恩·法雷蒙</div>
                          <div className="support-desc">
                            ✦ 路西恩的表哥<br />
                            ✦ 被父母寵溺+寄予厚望，養成粗俗又自卑的個性，相比路西恩像還沒社會化的小孩<br />
                            ✦ 嫉妒路西恩所擁有的聲望與能力
                          </div>
                        </div>
                      </div>

                      <div className="support-item">
                        <div className="support-avatar">
                          <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/無標題915_20260109111842.png" alt="Elody" referrerPolicy="no-referrer" />
                        </div>
                        <div className="support-info">
                          <div className="support-char-name">✧ 艾洛蒂·拉維捏</div>
                          <div className="support-desc">
                            ✦ 瓦爾托梅爾的公爵千金<br />
                            ✦ 艾蕾諾菈的筆友，在學院與她第一次見面並迅速成為常常互動的朋友<br />
                            ✦ 率真靈活，擅長引導他人走出傷痛
                          </div>
                        </div>
                      </div>

                      <div className="support-item">
                        <div className="support-avatar">伊維爾</div>
                        <div className="support-info">
                          <div className="support-char-name">✧ 伊維爾·艾凡</div>
                          <div className="support-desc">
                            ✦ 魔法學院的校長，古老神話「奧雷菲斯・維洛恩」的後裔，有其遺物<br />
                            ✦ 小男孩，舉止跳脫古怪，常被誤會是一年級新生<br />
                            ✦ 魔法實力強大到足以滅國，被譽為「神之子」<br />
                            ✦ 據說是前校長去世前強推上位的，各國國王其實都怒不敢言
                          </div>
                        </div>
                      </div>

                      <div className="support-item">
                        <div className="support-avatar">卡修斯</div>
                        <div className="support-info">
                          <div className="support-char-name">✧ 卡修斯·塞西爾</div>
                          <div className="support-desc">
                            ✦ 希鷺倫的二王子<br />
                            ✦ 有野心並堅信自己未來會成為這個國家的國王<br />
                            ✦ 是真的會對自己的人民與政策有所行動，例如：提前制定社福政策、保護素未謀面的人民<br />
                            ✦ 喜歡艾蕾諾菈，並在明知她已訂婚的情況下試圖拉近距離。<br />
                            其實他只是認為艾蕾諾菈適合當王妃，但不自知那不是真的愛。
                          </div>
                        </div>
                      </div>
                      
                      <div className="support-item">
                        <div className="support-avatar">奧斯丁</div>
                        <div className="support-info">
                          <div className="support-char-name">✧ 奧斯丁·費雪</div>
                          <div className="support-desc">
                            ✦ 伊維爾的管家，現多處理學校行政事物<br />
                            ✦ 原本生活順遂、自命不凡，因此看不起表現不出色的人，並對學生嚴厲，直到被剝奪貴族地位後，才在平民村落見識何為「人間」，再之後被伊維爾僱用<br />
                          </div>
                        </div>
                      </div>
                      
                      <div className="support-item">
                        <div className="support-avatar">管理者</div>
                        <div className="support-info">
                          <div className="support-char-name">✧ 管理者</div>
                          <div className="support-desc">
                            ✦ 類似於世界神明的存在，但非必要不會回應「禱告」等儀式<br />
                            ✦ 沒有感情，但會尊重人類的倫理道德<br />
                            ✦ 本體無實體，因化作人形與人類溝通有利故幻化成神寵想變成的樣子<br />
                            ✦ 會在人間挑選「神祭」協助管理世界
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Trivia Note */}
                <div className="flex justify-center py-10">
                  <div 
                    className="trivia-note animate relative" 
                    style={{ transform: `rotate(${triviaRotation}deg)` }}
                  >
                    {isEditMode && (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); shuffleTrivia(); }}
                          className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#bdbade] hover:bg-[#8a7f9c] flex items-center justify-center text-white text-[10px] font-bold shadow-sm z-[100] transition-colors cursor-pointer"
                          title="隨機跳轉"
                        >
                          🎲
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveEditSection('角色趣聞'); }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#bdbade] hover:bg-[#8a7f9c] flex items-center justify-center text-white text-[10px] font-bold shadow-sm z-[100] transition-colors cursor-pointer"
                          title="編輯趣聞"
                        >
                          ✎
                        </button>
                      </>
                    )}
                    <div className="pin"></div>
                    <span className="trivia-tag">✧ TRIVIA 趣聞 ✧</span>
                    <div className="trivia-text">
                      {currentTrivia}
                    </div>
                    <div className="trivia-footer">———— Recorded by Observer</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Library */}
        {activeTab === 'library' && (
          <div className="sub-page active">
            <Library 
              chapters={chaptersState} 
              isEditMode={isEditMode} 
              onEdit={() => setActiveEditSection('列表')} 
              onEditDetail={(idx) => {
                setEditingChapterIndex(idx);
                setActiveEditSection('文章內容');
              }}
            />
          </div>
        )}

        {/* Tab: Art */}
        {activeTab === 'art' && (
          <div className="sub-page active">
            <OceanEyesShowcase 
              isBackgroundPlaying={isPlaying} 
              setIsBackgroundPlaying={setIsPlaying} 
              isEditMode={isEditMode} 
              onEdit={() => setActiveEditSection('文章影片播放器')} 
              videoListState={videoListState}
              activeVideoIndex={activeVideoIndex}
              setActiveVideoIndex={setActiveVideoIndex}
            />
            <div className={`gallery-outer relative ${selectedArt ? 'detail-mode' : ''}`}>
              <div className={`gallery-title flex items-center justify-center gap-2 ${isEditMode ? 'ring-2 ring-purple-400 ring-dashed p-1.5 rounded-lg' : ''}`}>
                <span>༺ </span>
                <span
                  className={isEditMode ? 'bg-purple-50/50 outline-none cursor-text px-2 min-w-[50px] inline-block text-center' : ''}
                  contentEditable={isEditMode}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => {
                    const title = e.currentTarget.textContent || "";
                    setGalleryTitle(title);
                    saveFieldToFirebase('galleryTitle', title);
                  }}
                >
                  {galleryTitle}
                </span>
                <span> ༻</span>
                {isEditMode && (
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleSaveGalleryLayout();
                      }}
                      className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-white text-[10px] font-bold shadow-sm transition-all cursor-pointer ${
                        isLayoutDirty 
                          ? 'bg-green-600 hover:bg-green-700 border border-green-500 animate-pulse' 
                          : 'bg-[#bdbade] hover:bg-[#8a7f9c]'
                      }`}
                      title="儲存圖片尺寸與位置"
                    >
                      儲存
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveEditSection('畫廊'); }}
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#bdbade] hover:bg-[#8a7f9c] text-white text-[10px] font-bold shadow-sm transition-colors cursor-pointer"
                      title="編輯畫廊資料"
                    >
                      ✎
                    </button>
                  </div>
                )}
              </div>
              <div className="scroll-container">
                {(isEditMode ? tempGalleryItemsState : galleryItemsState).map((group: any, gIdx: number) => {
                  let hasSize4 = false;
                  group.rows?.forEach((row: any) => {
                    row.items?.forEach((item: any) => {
                      if (item.size === 4) hasSize4 = true;
                    });
                  });

                  return (
                    <div 
                      key={group.id || gIdx} 
                      className="art-col flex flex-col gap-5 items-center justify-center bg-white/5 border border-white/10 rounded-xl p-4 min-w-[160px]"
                    >
                      {/* If in edit mode, show group level actions */}
                      {isEditMode && (
                        <div className="flex gap-1 bg-[#8a7f9c]/20 p-1 rounded-lg text-[10px] text-white/90">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMoveAction(group.rows[0]?.items[0]?.id, 'left'); }}
                            className="px-1.5 py-0.5 bg-[#8a7f9c] hover:bg-[#746db5] rounded font-bold cursor-pointer transition-transform active:scale-95"
                            title="左移群組"
                          >
                            ◀ 群組
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMoveAction(group.rows[0]?.items[0]?.id, 'right'); }}
                            className="px-1.5 py-0.5 bg-[#8a7f9c] hover:bg-[#746db5] rounded font-bold cursor-pointer transition-transform active:scale-95"
                            title="右移群組"
                          >
                            群組 ▶
                          </button>
                          {!hasSize4 && gIdx > 0 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMoveAction(group.rows[0]?.items[0]?.id, 'merge-left'); }}
                              className="px-1 py-0.5 bg-amber-600/80 hover:bg-amber-600 rounded font-bold cursor-pointer"
                              title="合併至左側群組"
                            >
                              ◀ 合併
                            </button>
                          )}
                          {!hasSize4 && gIdx < (isEditMode ? tempGalleryItemsState : galleryItemsState).length - 1 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMoveAction(group.rows[0]?.items[0]?.id, 'merge-right'); }}
                              className="px-1 py-0.5 bg-amber-600/80 hover:bg-amber-600 rounded font-bold cursor-pointer"
                              title="合併至右側群組"
                            >
                              合併 ▶
                            </button>
                          )}
                        </div>
                      )}

                      {/* Render rows in the group */}
                      {group.rows?.map((row: any, rIdx: number) => {
                        return (
                          <div 
                            key={row.id || rIdx} 
                            className="flex gap-4 items-center justify-center w-full"
                          >
                            {row.items?.map((item: any, iIdx: number) => {
                              const isSelected = selectedArt === item.url;
                              
                              // Calculate inline dimensions for unselected frames
                              let styleDim: React.CSSProperties = {};
                              if (!isSelected) {
                                if (item.orientation === 'portrait') {
                                  styleDim = { height: '380px', width: '280px' };
                                } else if (item.orientation === 'landscape') {
                                  if (item.size === 4) {
                                    styleDim = { height: '280px', width: '380px' };
                                  } else {
                                    styleDim = { height: '175px', width: '250px' };
                                  }
                                } else { // square
                                  if (item.size === 4) {
                                    styleDim = { height: '320px', width: '320px' };
                                  } else if (item.size === 2) {
                                    styleDim = { height: '200px', width: '200px' };
                                  } else {
                                    styleDim = { height: '175px', width: '175px' };
                                  }
                                }
                              }

                              const currentMetadataState = isEditMode ? tempArtMetadataState : artMetadataState;
                              const itemMetadata = getArtInfo(item.url);

                              return (
                                <div 
                                  key={item.id || iIdx}
                                  className={`art-frame relative flex flex-col justify-center items-center ${isSelected ? 'selected' : ''}`}
                                  style={styleDim}
                                  onClick={() => setSelectedArt(isSelected ? null : item.url)}
                                >
                                  <img 
                                    src={item.url} 
                                    alt={itemMetadata.title} 
                                    referrerPolicy="no-referrer"
                                    className="max-h-full max-w-full object-contain"
                                  />

                                  {/* If selected (lightbox), render information panel */}
                                  {isSelected && (
                                    <div className="art-info-panel" onClick={(e) => e.stopPropagation()}>
                                      <div className="info-item"><span>作品名：</span>{itemMetadata.title}</div>
                                      <div className="info-item"><span>創作日期：</span>{itemMetadata.date}</div>
                                      <div className="info-item"><span>繪師：</span>{itemMetadata.artist}</div>
                                    </div>
                                  )}

                                  {/* Edit Mode Controls Overlay */}
                                  {isEditMode && !isSelected && (
                                    <div 
                                      className="absolute inset-0 bg-black/70 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-stretch justify-between p-2 z-10 rounded text-white"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {/* Top Row: Delete & Orientation Switch */}
                                      <div className="flex justify-between items-center">
                                        <div className="flex bg-white/20 p-0.5 rounded text-[9px]">
                                          <button
                                            onClick={() => handleOrientationChange(item.id, 'portrait')}
                                            className={`px-1.5 py-0.5 rounded ${item.orientation === 'portrait' ? 'bg-[#8a7f9c] text-white font-bold' : 'text-gray-300 hover:text-white'}`}
                                            title="設為直式"
                                          >
                                            直
                                          </button>
                                          <button
                                            onClick={() => handleOrientationChange(item.id, 'landscape')}
                                            className={`px-1.5 py-0.5 rounded ${item.orientation === 'landscape' ? 'bg-[#8a7f9c] text-white font-bold' : 'text-gray-300 hover:text-white'}`}
                                            title="設為橫式"
                                          >
                                            橫
                                          </button>
                                          <button
                                            onClick={() => handleOrientationChange(item.id, 'square')}
                                            className={`px-1.5 py-0.5 rounded ${item.orientation === 'square' ? 'bg-[#8a7f9c] text-white font-bold' : 'text-gray-300 hover:text-white'}`}
                                            title="設為正方形"
                                          >
                                            方
                                          </button>
                                        </div>
                                        <button
                                          onClick={() => {
                                            if (confirm("確認要刪除這張圖片嗎？")) {
                                              handleDeleteItem(item.id);
                                            }
                                          }}
                                          className="w-5 h-5 bg-red-600 hover:bg-red-700 rounded flex items-center justify-center text-[10px] font-bold cursor-pointer"
                                          title="刪除圖片"
                                        >
                                          ✕
                                        </button>
                                      </div>

                                      {/* Middle: Sizing options */}
                                      <div className="flex flex-col gap-1 items-center justify-center my-1">
                                        <span className="text-[9px] text-gray-300 font-bold">大小尺寸 (Size)</span>
                                        <div className="flex gap-1 bg-white/10 p-0.5 rounded text-[10px]">
                                          {item.orientation === 'square' && (
                                            <button
                                              onClick={() => handleSizeChange(item.id, 1)}
                                              className={`px-2 py-0.5 rounded font-bold ${item.size === 1 ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}
                                            >
                                              1
                                            </button>
                                          )}
                                          {(item.orientation === 'landscape' || item.orientation === 'square') && (
                                            <button
                                              onClick={() => handleSizeChange(item.id, 2)}
                                              className={`px-2 py-0.5 rounded font-bold ${item.size === 2 ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}
                                            >
                                              2
                                            </button>
                                          )}
                                          <button
                                            onClick={() => handleSizeChange(item.id, 4)}
                                            className={`px-2 py-0.5 rounded font-bold ${item.size === 4 ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}
                                          >
                                            4
                                          </button>
                                        </div>
                                        {item.orientation === 'portrait' && (
                                          <span className="text-[8px] text-indigo-300">直式僅限大小 4</span>
                                        )}
                                        {item.orientation === 'landscape' && (
                                          <span className="text-[8px] text-indigo-300">橫式僅限大小 4 或 2</span>
                                        )}
                                      </div>

                                      {/* Bottom Row: Item Movement Actions */}
                                      <div className="flex flex-wrap gap-1 justify-center bg-white/5 p-1 rounded">
                                        {item.size === 4 ? (
                                          <span className="text-[8px] text-gray-400">大小 4 僅能左右移動整個群組</span>
                                        ) : (
                                          <>
                                            {/* Row movement */}
                                            {group.rows.length > 1 && (
                                              <>
                                                <button
                                                  onClick={() => handleMoveAction(item.id, 'up')}
                                                  className="px-1 py-0.5 bg-sky-700 hover:bg-sky-600 rounded text-[9px] font-bold"
                                                  title="上移"
                                                >
                                                  ▲ 上
                                                </button>
                                                <button
                                                  onClick={() => handleMoveAction(item.id, 'down')}
                                                  className="px-1 py-0.5 bg-sky-700 hover:bg-sky-600 rounded text-[9px] font-bold"
                                                  title="下移"
                                                >
                                                  ▼ 下
                                                </button>
                                              </>
                                            )}
                                            {row.items.length === 2 && (
                                              <button
                                                onClick={() => handleMoveAction(item.id, 'swap-row')}
                                                className="px-1 py-0.5 bg-[#8a7f9c] hover:bg-[#746db5] rounded text-[9px] font-bold"
                                                title="左右互換"
                                              >
                                                ⇄ 互換
                                              </button>
                                            )}
                                            <button
                                              onClick={() => handleMoveAction(item.id, 'split')}
                                              className="px-1 py-0.5 bg-indigo-700 hover:bg-indigo-600 rounded text-[9px] font-bold"
                                              title="將此圖拆分至獨立的新群組"
                                            >
                                              ⎋ 獨立群組
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lightbox flex"
            onClick={() => setLightboxImg(null)}
          >
            <img src={lightboxImg} alt="Zoomed" referrerPolicy="no-referrer" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100001] backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-6 w-[90%] max-w-sm shadow-2xl border border-gray-100 relative"
            >
              <button 
                onClick={() => { setShowPasswordModal(false); setPasswordInput(''); setPasswordError(null); }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-lg font-bold text-[#8a7f9c] mb-4 border-l-4 border-[#8a7f9c] pl-2">輸入解鎖密碼</h3>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <input 
                    type="password" 
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="請輸入密碼"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8a7f9c] text-center text-lg tracking-widest"
                    autoFocus
                  />
                  {passwordError && (
                    <p className="text-red-500 text-xs mt-1 text-center font-semibold">{passwordError}</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => { setShowPasswordModal(false); setPasswordInput(''); setPasswordError(null); }}
                    className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2 bg-[#8a7f9c] hover:bg-[#746db5] text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                  >
                    確定
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showAddSourceModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100001] backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-6 w-[90%] max-w-sm shadow-2xl border border-gray-100 relative"
            >
              <button 
                onClick={() => { setShowAddSourceModal(false); setNewSourceName(''); setNewSourceUrl(''); setNewSourceError(null); }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-lg font-bold text-[#8a7f9c] mb-4 border-l-4 border-[#8a7f9c] pl-2">新增資料來源</h3>
              
              <form onSubmit={handleAddSourceSubmit} className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">名稱</label>
                    <input 
                      type="text" 
                      value={newSourceName}
                      onChange={(e) => setNewSourceName(e.target.value)}
                      placeholder="例如：蜜月アン・ドゥ・トロワ"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8a7f9c] text-xs text-gray-700"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">網址</label>
                    <input 
                      type="text" 
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                      placeholder="例如：https://youtube.com/..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8a7f9c] text-xs text-gray-700 font-mono"
                    />
                  </div>
                  {newSourceError && (
                    <p className="text-red-500 text-xs mt-1 text-center font-semibold">{newSourceError}</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => { setShowAddSourceModal(false); setNewSourceName(''); setNewSourceUrl(''); setNewSourceError(null); }}
                    className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2 bg-[#8a7f9c] hover:bg-[#746db5] text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                  >
                    確定
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section Edit Modal */}
      <AnimatePresence>
        {activeEditSection && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100002] backdrop-blur-sm p-4"
            onClick={handleCloseRequest}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-6 md:p-8 w-[90%] max-w-lg shadow-2xl relative max-h-[90vh] flex flex-col justify-between overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={handleCloseRequest}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded-full hover:bg-gray-100 transition-colors z-[1001]"
              >
                <X size={20} />
              </button>
              
              <div className="flex-grow flex flex-col justify-start items-stretch overflow-hidden">
                <h2 className="text-lg font-bold text-[#8a7f9c] mb-4 border-l-4 border-[#8a7f9c] pl-2 flex-shrink-0">正在編輯：{activeEditSection}</h2>

                {activeEditSection === '世界觀' && tempWikiData ? (
                  <div className="flex-grow flex flex-col justify-start items-stretch text-left overflow-hidden">
                    {/* Tab Buttons inside the worldview editor */}
                    <div className="flex gap-2 mb-4 justify-center flex-shrink-0">
                      <button 
                        onClick={() => setEditorTab('worldview')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${editorTab === 'worldview' ? 'bg-[#8a7f9c] text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                      >
                        世界觀
                      </button>
                      <button 
                        onClick={() => setEditorTab('countries')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${editorTab === 'countries' ? 'bg-[#8a7f9c] text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                      >
                        國家
                      </button>
                      <button 
                        onClick={() => setEditorTab('families')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${editorTab === 'families' ? 'bg-[#8a7f9c] text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                      >
                        家族
                      </button>
                    </div>

                    {/* Scrollable list of items being edited */}
                    <div className="flex-grow overflow-y-auto max-h-[50vh] pr-2 space-y-4">
                      {editorTab === 'worldview' && (
                        <div className="space-y-3">
                          {tempWikiData.worldview.map((item: string, idx: number) => (
                            <div 
                              key={idx}
                              draggable
                              onDragStart={() => handleDragStartWorldview(idx)}
                              onDragOver={(e) => handleDragOverWorldview(e, idx)}
                              onDragEnd={() => { setDraggedIndex(null); setDraggedType(null); }}
                              className={`flex items-start gap-2 group border border-dashed rounded-lg p-2 ${draggedType === 'worldview' && draggedIndex === idx ? 'border-gray-400 bg-gray-50' : 'border-transparent'} transition-all`}
                            >
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing text-gray-400 text-sm font-semibold select-none pt-1">
                                ☰
                              </div>
                              <span className="text-gray-500 text-xs w-[60px] pt-2">核心 {idx + 1}：</span>
                              <textarea 
                                value={item} 
                                onChange={(e) => {
                                  const updated = [...tempWikiData.worldview];
                                  updated[idx] = e.target.value;
                                  setTempWikiData({ ...tempWikiData, worldview: updated });
                                  setIsDirty(true);
                                }}
                                className="flex-1 px-2 py-1 border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#8a7f9c] text-xs resize-none h-16"
                              />
                              <button 
                                onClick={() => {
                                  const updated = [...tempWikiData.worldview];
                                  updated.splice(idx, 1);
                                  setTempWikiData({ ...tempWikiData, worldview: updated });
                                  setIsDirty(true);
                                }}
                                className="text-gray-400 hover:text-red-600 text-xs pt-2 cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          {tempWikiData.worldview.length === 0 && (
                            <p className="text-gray-400 text-center text-xs py-4">無核心設定資料</p>
                          )}
                        </div>
                      )}

                      {editorTab === 'countries' && (
                        <div className="space-y-4">
                          {tempWikiData.countries.map((country: any, cidx: number) => (
                            <div 
                              key={country.id}
                              draggable
                              onDragStart={() => handleDragStartCountry(cidx)}
                              onDragOver={(e) => handleDragOverCountry(e, cidx)}
                              onDragEnd={() => { setDraggedIndex(null); setDraggedType(null); }}
                              className={`border border-dashed ${draggedType === 'country' && draggedIndex === cidx ? 'border-gray-400 bg-gray-50' : 'border-gray-200'} rounded-xl p-4 relative group`}
                            >
                              {/* Header: drag handle + title + input + delete */}
                              <div className="flex items-center gap-2 mb-2">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing text-gray-400 text-sm font-semibold select-none">
                                  ☰
                                </div>
                                <span className="font-bold text-gray-700 text-xs w-[60px]">國家 {cidx + 1}：</span>
                                <input 
                                  type="text" 
                                  value={country.name} 
                                  onChange={(e) => {
                                    const updated = [...tempWikiData.countries];
                                    updated[cidx].name = e.target.value;
                                    setTempWikiData({ ...tempWikiData, countries: updated });
                                    setIsDirty(true);
                                  }}
                                  className="flex-1 px-2 py-1 border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#8a7f9c] text-xs font-semibold"
                                />
                                <button 
                                  onClick={() => {
                                    const updated = [...tempWikiData.countries];
                                    updated.splice(cidx, 1);
                                    setTempWikiData({ ...tempWikiData, countries: updated });
                                    setIsDirty(true);
                                  }}
                                  className="text-red-400 hover:text-red-600 text-xs px-2 cursor-pointer"
                                >
                                  刪除
                                </button>
                              </div>

                              {/* English Name (no drag handle) */}
                              <div className="flex items-center gap-2 mb-3 pl-6">
                                <span className="text-gray-500 text-xs w-[60px]">英文名：</span>
                                <input 
                                  type="text" 
                                  value={country.englishName} 
                                  onChange={(e) => {
                                    const updated = [...tempWikiData.countries];
                                    updated[cidx].englishName = e.target.value;
                                    setTempWikiData({ ...tempWikiData, countries: updated });
                                    setIsDirty(true);
                                  }}
                                  className="flex-1 px-2 py-1 border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#8a7f9c] text-xs"
                                />
                              </div>

                              {/* Country descriptions with their own handles */}
                              <div className="space-y-2 pl-6">
                                {country.descriptions.map((desc: string, didx: number) => (
                                  <div 
                                    key={didx}
                                    draggable
                                    onDragStart={(e) => {
                                      e.stopPropagation();
                                      handleDragStartDescription(country.id, didx);
                                    }}
                                    onDragOver={(e) => {
                                      e.stopPropagation();
                                      handleDragOverDescription(e, country.id, didx);
                                    }}
                                    onDragEnd={() => { setDraggedParentId(null); setDraggedDescriptionIndex(null); setDraggedType(null); }}
                                    className={`flex items-start gap-2 group/desc relative border border-dashed rounded p-1 ${draggedType === 'description' && draggedParentId === country.id && draggedDescriptionIndex === didx ? 'border-gray-400 bg-gray-50' : 'border-transparent'} transition-all`}
                                  >
                                    <div className="opacity-0 group-hover/desc:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing text-gray-400 text-sm font-semibold select-none pt-1">
                                      ☰
                                    </div>
                                    <span className="text-gray-500 text-xs w-[60px] pt-2">介紹 {didx + 1}：</span>
                                    <textarea 
                                      value={desc} 
                                      onChange={(e) => {
                                        const updated = [...tempWikiData.countries];
                                        updated[cidx].descriptions[didx] = e.target.value;
                                        setTempWikiData({ ...tempWikiData, countries: updated });
                                        setIsDirty(true);
                                      }}
                                      className="flex-1 px-2 py-1 border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#8a7f9c] text-xs resize-none h-16"
                                    />
                                    <button 
                                      onClick={() => {
                                        const updated = [...tempWikiData.countries];
                                        updated[cidx].descriptions.splice(didx, 1);
                                        setTempWikiData({ ...tempWikiData, countries: updated });
                                        setIsDirty(true);
                                      }}
                                      className="text-gray-400 hover:text-red-600 text-xs pt-2 cursor-pointer"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}

                                {/* "+" button at the bottom of the country's descriptions with highlight on hover */}
                                <div className="flex justify-start mt-2">
                                  <button
                                    onClick={() => {
                                      const updated = [...tempWikiData.countries];
                                      updated[cidx].descriptions.push("");
                                      setTempWikiData({ ...tempWikiData, countries: updated });
                                      setIsDirty(true);
                                    }}
                                    className="w-8 h-8 rounded-full border border-dashed border-[#8a7f9c] text-[#8a7f9c] hover:bg-[#8a7f9c] hover:text-white flex items-center justify-center text-sm font-bold transition-all duration-200 cursor-pointer"
                                    title="新增介紹"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {tempWikiData.countries.length === 0 && (
                            <p className="text-gray-400 text-center text-xs py-4">無國家資料</p>
                          )}
                        </div>
                      )}

                      {editorTab === 'families' && (
                        <div className="space-y-4">
                          {tempWikiData.families.map((family: any, fidx: number) => (
                            <div 
                              key={family.id}
                              draggable
                              onDragStart={() => handleDragStartFamily(fidx)}
                              onDragOver={(e) => handleDragOverFamily(e, fidx)}
                              onDragEnd={() => { setDraggedIndex(null); setDraggedType(null); }}
                              className={`border border-dashed ${draggedType === 'family' && draggedIndex === fidx ? 'border-gray-400 bg-gray-50' : 'border-gray-200'} rounded-xl p-4 relative group`}
                            >
                              {/* Header */}
                              <div className="flex items-center gap-2 mb-2">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing text-gray-400 text-sm font-semibold select-none">
                                  ☰
                                </div>
                                <span className="font-bold text-gray-700 text-xs w-[60px]">家族 {fidx + 1}：</span>
                                <input 
                                  type="text" 
                                  value={family.name} 
                                  onChange={(e) => {
                                    const updated = [...tempWikiData.families];
                                    updated[fidx].name = e.target.value;
                                    setTempWikiData({ ...tempWikiData, families: updated });
                                    setIsDirty(true);
                                  }}
                                  className="flex-1 px-2 py-1 border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#8a7f9c] text-xs font-semibold"
                                />
                                <button 
                                  onClick={() => {
                                    const updated = [...tempWikiData.families];
                                    updated.splice(fidx, 1);
                                    setTempWikiData({ ...tempWikiData, families: updated });
                                    setIsDirty(true);
                                  }}
                                  className="text-red-400 hover:text-red-600 text-xs px-2 cursor-pointer"
                                >
                                  刪除
                                </button>
                              </div>

                              {/* English Name (no drag handle) */}
                              <div className="flex items-center gap-2 mb-3 pl-6">
                                <span className="text-gray-500 text-xs w-[60px]">英文名：</span>
                                <input 
                                  type="text" 
                                  value={family.englishName} 
                                  onChange={(e) => {
                                    const updated = [...tempWikiData.families];
                                    updated[fidx].englishName = e.target.value;
                                    setTempWikiData({ ...tempWikiData, families: updated });
                                    setIsDirty(true);
                                  }}
                                  className="flex-1 px-2 py-1 border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#8a7f9c] text-xs"
                                />
                              </div>

                              {/* Family descriptions with handles */}
                              <div className="space-y-2 pl-6">
                                {family.descriptions.map((desc: string, didx: number) => (
                                  <div 
                                    key={didx}
                                    draggable
                                    onDragStart={(e) => {
                                      e.stopPropagation();
                                      handleDragStartDescription(family.id, didx);
                                    }}
                                    onDragOver={(e) => {
                                      e.stopPropagation();
                                      handleDragOverDescription(e, family.id, didx);
                                    }}
                                    onDragEnd={() => { setDraggedParentId(null); setDraggedDescriptionIndex(null); setDraggedType(null); }}
                                    className={`flex items-start gap-2 group/desc relative border border-dashed rounded p-1 ${draggedType === 'description' && draggedParentId === family.id && draggedDescriptionIndex === didx ? 'border-gray-400 bg-gray-50' : 'border-transparent'} transition-all`}
                                  >
                                    <div className="opacity-0 group-hover/desc:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing text-gray-400 text-sm font-semibold select-none pt-1">
                                      ☰
                                    </div>
                                    <span className="text-gray-500 text-xs w-[60px] pt-2">介紹 {didx + 1}：</span>
                                    <textarea 
                                      value={desc} 
                                      onChange={(e) => {
                                        const updated = [...tempWikiData.families];
                                        updated[fidx].descriptions[didx] = e.target.value;
                                        setTempWikiData({ ...tempWikiData, families: updated });
                                        setIsDirty(true);
                                      }}
                                      className="flex-1 px-2 py-1 border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#8a7f9c] text-xs resize-none h-16"
                                    />
                                    <button 
                                      onClick={() => {
                                        const updated = [...tempWikiData.families];
                                        updated[fidx].descriptions.splice(didx, 1);
                                        setTempWikiData({ ...tempWikiData, families: updated });
                                        setIsDirty(true);
                                      }}
                                      className="text-gray-400 hover:text-red-600 text-xs pt-2 cursor-pointer"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}

                                {/* "+" button at the bottom of the family's descriptions with highlight on hover */}
                                <div className="flex justify-start mt-2">
                                  <button
                                    onClick={() => {
                                      const updated = [...tempWikiData.families];
                                      updated[fidx].descriptions.push("");
                                      setTempWikiData({ ...tempWikiData, families: updated });
                                      setIsDirty(true);
                                    }}
                                    className="w-8 h-8 rounded-full border border-dashed border-[#8a7f9c] text-[#8a7f9c] hover:bg-[#8a7f9c] hover:text-white flex items-center justify-center text-sm font-bold transition-all duration-200 cursor-pointer"
                                    title="新增介紹"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {tempWikiData.families.length === 0 && (
                            <p className="text-gray-400 text-center text-xs py-4">無家族資料</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer action bar with Add and Save buttons */}
                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center relative flex-shrink-0">
                      <div>
                        {editorTab === 'worldview' && (
                          <button 
                            onClick={() => {
                              const updated = [...tempWikiData.worldview, "請輸入新的核心設定"];
                              setTempWikiData({ ...tempWikiData, worldview: updated });
                              setIsDirty(true);
                            }}
                            className="border border-[#8a7f9c] text-[#8a7f9c] bg-white hover:bg-[#8a7f9c] hover:text-white px-4 py-1.5 rounded-lg text-xs transition-colors duration-200 flex items-center gap-1 cursor-pointer font-bold"
                          >
                            + 新增核心
                          </button>
                        )}
                        {editorTab === 'countries' && (
                          <button 
                            onClick={() => {
                              const newCountry = {
                                id: `c-${Date.now()}`,
                                name: `新國家`,
                                englishName: `NewCountry`,
                                descriptions: ["請輸入介紹內容"]
                              };
                              setTempWikiData({
                                ...tempWikiData,
                                countries: [...tempWikiData.countries, newCountry]
                              });
                              setIsDirty(true);
                            }}
                            className="border border-[#8a7f9c] text-[#8a7f9c] bg-white hover:bg-[#8a7f9c] hover:text-white px-4 py-1.5 rounded-lg text-xs transition-all duration-200 flex items-center gap-1 cursor-pointer font-bold"
                          >
                            + 新增國家
                          </button>
                        )}
                        {editorTab === 'families' && (
                          <button 
                            onClick={() => {
                              const newFamily = {
                                id: `f-${Date.now()}`,
                                name: `新家族`,
                                englishName: `NewFamily`,
                                descriptions: ["請輸入介紹內容"]
                              };
                              setTempWikiData({
                                ...tempWikiData,
                                families: [...tempWikiData.families, newFamily]
                              });
                              setIsDirty(true);
                            }}
                            className="border border-[#8a7f9c] text-[#8a7f9c] bg-white hover:bg-[#8a7f9c] hover:text-white px-4 py-1.5 rounded-lg text-xs transition-all duration-200 flex items-center gap-1 cursor-pointer font-bold"
                          >
                            + 新增家族
                          </button>
                        )}
                      </div>

                      <button 
                        onClick={handleSaveWorldview}
                        className="px-5 py-1.5 bg-[#8a7f9c] hover:bg-[#746db5] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                      >
                        儲存
                      </button>
                    </div>
                  </div>
                ) : activeEditSection === '列表' ? (
                  <div className="flex-grow flex flex-col justify-start items-stretch text-left overflow-hidden">
                    <h3 className="text-xs font-bold text-gray-600 mb-3 flex-shrink-0">編輯章節列表：</h3>
                    <div className="space-y-4 overflow-y-auto pr-2 flex-grow max-h-[50vh]">
                      {tempChaptersState.map((ch, idx) => (
                        <div key={idx} className="border border-gray-100 rounded-lg p-3 space-y-2 relative group">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500 font-bold">{idx + 1}：</span>
                            <button
                              onClick={() => {
                                const updated = tempChaptersState.filter((_, i) => i !== idx);
                                setTempChaptersState(updated);
                                setIsDirty(true);
                              }}
                              className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer transition-colors"
                            >
                              刪除
                            </button>
                          </div>
                          <div className="flex gap-2 items-center">
                            <span className="text-xs text-gray-500 font-bold w-[70px]">章節序：</span>
                            <input 
                              type="text"
                              value={ch.title}
                              onChange={(e) => {
                                const updated = [...tempChaptersState];
                                updated[idx].title = e.target.value;
                                setTempChaptersState(updated);
                                setIsDirty(true);
                              }}
                              className="flex-1 px-2 py-1 border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#8a7f9c] text-xs font-semibold"
                              placeholder="例如：序章、第一章"
                            />
                          </div>
                          <div className="flex gap-2 items-center">
                            <span className="text-xs text-gray-500 font-bold w-[70px]">標題：</span>
                            <input 
                              type="text"
                              value={ch.subTitle || ''}
                              onChange={(e) => {
                                const updated = [...tempChaptersState];
                                updated[idx].subTitle = e.target.value;
                                setTempChaptersState(updated);
                                setIsDirty(true);
                              }}
                              className="flex-1 px-2 py-1 border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#8a7f9c] text-xs"
                              placeholder="章節副標題"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Chapter Add "+" Button & Save Button */}
                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center flex-shrink-0">
                      <button
                        onClick={() => {
                          const newCh = {
                            title: `第${tempChaptersState.length}章`,
                            subTitle: `新章節`,
                            meta: `Silerune // Diary`,
                            content: `<p>請輸入新章節內文...</p>`
                          };
                          setTempChaptersState([...tempChaptersState, newCh]);
                          setIsDirty(true);
                        }}
                        className="border border-[#8a7f9c] text-[#8a7f9c] bg-white hover:bg-[#8a7f9c] hover:text-white px-4 py-1.5 rounded-lg text-xs transition-all duration-200 flex items-center gap-1 cursor-pointer font-bold"
                      >
                        + 新增章節
                      </button>
                      <button 
                        onClick={handleSaveChapters}
                        className="px-5 py-1.5 bg-[#8a7f9c] hover:bg-[#746db5] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        儲存
                      </button>
                    </div>
                  </div>
                ) : activeEditSection === '文章內容' && editingChapterIndex !== null && tempChaptersState[editingChapterIndex] ? (
                  <div className="flex-grow flex flex-col justify-start items-stretch text-left overflow-hidden">
                    <div className="space-y-4 overflow-y-auto pr-2 flex-grow max-h-[55vh] flex flex-col">
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <label className="text-xs font-bold text-gray-500">標題：</label>
                        <input 
                          type="text"
                          value={tempChaptersState[editingChapterIndex].subTitle || ''}
                          onChange={(e) => {
                            const updated = [...tempChaptersState];
                            updated[editingChapterIndex].subTitle = e.target.value;
                            setTempChaptersState(updated);
                            setIsDirty(true);
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8a7f9c] text-xs font-semibold"
                          placeholder="請輸入章節標題"
                        />
                      </div>
                      <div className="flex flex-col gap-1 flex-grow min-h-[200px]">
                        <label className="text-xs font-bold text-gray-500">內文：</label>
                        <textarea 
                          value={tempChapterContentText}
                          onChange={(e) => {
                            setTempChapterContentText(e.target.value);
                            setIsDirty(true);
                          }}
                          className="w-full h-full min-h-[180px] flex-grow px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8a7f9c] text-xs font-sans overflow-y-auto leading-relaxed"
                          placeholder="請輸入章節內文，段落間請空一行"
                        />
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0">
                      <button 
                        onClick={() => {
                          const updated = tempChaptersState.filter((_, i) => i !== editingChapterIndex);
                          setChaptersState(updated);
                          saveFieldToFirebase('chaptersState', updated);
                          setIsDirty(false);
                          setActiveEditSection(null);
                        }}
                        className="mr-auto px-4 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        刪除
                      </button>
                      <button 
                        onClick={handleCloseRequest}
                        className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        取消
                      </button>
                      <button 
                        onClick={handleSaveChapterContent}
                        className="px-5 py-1.5 bg-[#8a7f9c] hover:bg-[#746db5] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        儲存
                      </button>
                    </div>
                  </div>
                ) : activeEditSection === '畫廊' && tempArtMetadataState ? (
                  <div className="flex-grow flex flex-col justify-start items-stretch text-left overflow-hidden">
                    <div className="space-y-4 overflow-y-auto pr-2 flex-grow max-h-[55vh] flex flex-col">
                      {/* Title of the gallery section */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <label className="text-xs font-bold text-gray-500">標題：</label>
                        <input 
                          type="text"
                          value={tempGalleryTitle}
                          onChange={(e) => {
                            setTempGalleryTitle(e.target.value);
                            setIsDirty(true);
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8a7f9c] text-xs font-semibold"
                          placeholder="請輸入畫廊標題"
                        />
                      </div>

                      {/* Add Image URL Input */}
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <label className="text-xs font-bold text-gray-500">輸入圖片檔名或網址：</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={galleryImageInput}
                            onChange={(e) => setGalleryImageInput(e.target.value)}
                            placeholder="例如：IMG_5697.png 或 https://..."
                            className="flex-grow px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-700 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!galleryImageInput.trim()) return;
                              const url = resolveImageUrl(galleryImageInput.trim());
                              const filename = galleryImageInput.trim().split('/').pop() || galleryImageInput.trim();
                              
                              const updatedMeta = { ...tempArtMetadataState };
                              updatedMeta[url] = {
                                title: filename.split('.').pop() ? filename.substring(0, filename.lastIndexOf('.')) : filename,
                                date: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' }),
                                artist: '青雲（作者）'
                              };
                              setTempArtMetadataState(updatedMeta);

                              const newGroupId = `group-new-${Date.now()}`;
                              const newGroup = {
                                id: newGroupId,
                                rows: [
                                  {
                                    id: `row-new-${Date.now()}`,
                                    items: [
                                      {
                                        id: `img-new-${Date.now()}`,
                                        url: url,
                                        size: 4, // 預設大小是 4
                                        orientation: getInitialOrientation(url)
                                      }
                                    ]
                                  }
                                ]
                              };

                              const updatedItems = [...tempGalleryItemsState, newGroup];
                              setTempGalleryItemsState(updatedItems);
                              setGalleryImageInput('');
                              setIsDirty(true);
                            }}
                            className="px-4 py-2 bg-[#8a7f9c] hover:bg-[#746db5] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                          >
                            新增圖片
                          </button>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          輸入檔名後，系統會自動轉換為完整網址。
                        </span>
                      </div>

                      {/* Existing Items Manager */}
                      <div className="flex-grow flex flex-col">
                        <label className="text-xs font-bold text-gray-500 mb-2">現有畫廊作品：</label>
                        <div className="space-y-4 pr-1">
                          {tempGalleryItemsState.map((group: any, idx: number) => {
                            const urls: string[] = [];
                            group.rows?.forEach((row: any) => {
                              row.items?.forEach((item: any) => {
                                urls.push(item.url);
                              });
                            });

                            return (
                              <div key={group.id || idx} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50 flex flex-col gap-2">
                                <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                                  <span className="text-xs text-gray-400 font-bold">作品群組 {idx + 1}</span>
                                  <button
                                    onClick={() => {
                                      const updated = tempGalleryItemsState.filter((_, i) => i !== idx);
                                      setTempGalleryItemsState(updated);
                                      setIsDirty(true);
                                    }}
                                    className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer transition-colors"
                                  >
                                    刪除
                                  </button>
                                </div>
                                <div className="flex gap-3">
                                  <div className="flex flex-wrap gap-1 w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden justify-center items-center">
                                    {urls.slice(0, 4).map((url, uidx) => (
                                      <img key={uidx} src={url} alt="Preview" className="w-7 h-7 object-cover" referrerPolicy="no-referrer" />
                                    ))}
                                  </div>
                                  
                                  <div className="flex-grow space-y-3">
                                    {urls.map((url, uidx) => {
                                      const filename = decodeURIComponent(url.split('/').pop() || '');
                                      const metadata = tempArtMetadataState[filename] || tempArtMetadataState[url] || { title: '新作品', date: '', artist: '' };
                                      return (
                                        <div key={uidx} className="border-l-2 border-[#8a7f9c]/30 pl-2 py-1 space-y-1 text-left">
                                          <div className="flex gap-1 items-center">
                                            <span className="text-[10px] text-gray-400 font-bold w-[45px]">名稱：</span>
                                            <input 
                                              type="text"
                                              value={metadata.title}
                                              onChange={(e) => {
                                                const updatedMeta = { ...tempArtMetadataState };
                                                updatedMeta[filename] = { ...metadata, title: e.target.value };
                                                setTempArtMetadataState(updatedMeta);
                                                setIsDirty(true);
                                              }}
                                              className="flex-1 px-2 py-0.5 border border-gray-200 rounded text-xs text-gray-700"
                                            />
                                          </div>
                                          <div className="flex gap-1 items-center">
                                            <span className="text-[10px] text-gray-400 font-bold w-[45px]">日期：</span>
                                            <input 
                                              type="text"
                                              value={metadata.date}
                                              onChange={(e) => {
                                                const updatedMeta = { ...tempArtMetadataState };
                                                updatedMeta[filename] = { ...metadata, date: e.target.value };
                                                setTempArtMetadataState(updatedMeta);
                                                setIsDirty(true);
                                              }}
                                              className="flex-1 px-2 py-0.5 border border-gray-200 rounded text-xs text-gray-700"
                                            />
                                          </div>
                                          <div className="flex gap-1 items-center">
                                            <span className="text-[10px] text-gray-400 font-bold w-[45px]">繪師：</span>
                                            <input 
                                              type="text"
                                              value={metadata.artist}
                                              onChange={(e) => {
                                                const updatedMeta = { ...tempArtMetadataState };
                                                updatedMeta[filename] = { ...metadata, artist: e.target.value };
                                                setTempArtMetadataState(updatedMeta);
                                                setIsDirty(true);
                                              }}
                                              className="flex-1 px-2 py-0.5 border border-gray-200 rounded text-xs text-gray-700"
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0">
                      <button 
                        onClick={handleCloseRequest}
                        className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        取消
                      </button>
                      <button 
                        onClick={handleSaveArtMetadata}
                        className="px-5 py-1.5 bg-[#8a7f9c] hover:bg-[#746db5] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        儲存
                      </button>
                    </div>
                  </div>
                ) : activeEditSection === '音樂播放器' && tempPlayerConfig ? (
                  <div className="flex-grow flex flex-col justify-start items-stretch text-left overflow-hidden">
                    <div className="space-y-4 overflow-y-auto pr-2 flex-grow max-h-[55vh] flex flex-col">
                      {/* Title */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <label className="text-xs font-bold text-gray-500">標題：</label>
                        <input 
                          type="text"
                          value={tempPlayerConfig.title}
                          onChange={(e) => {
                            setTempPlayerConfig({ ...tempPlayerConfig, title: e.target.value });
                            setIsDirty(true);
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8a7f9c] text-xs font-semibold"
                          placeholder="請輸入音樂標題"
                        />
                      </div>

                      {/* Audio Filename */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <label className="text-xs font-bold text-gray-500">音檔：</label>
                        <input 
                          type="text" 
                          value={tempPlayerConfig.audioFileName || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTempPlayerConfig({
                              ...tempPlayerConfig,
                              audioFileName: val,
                              audioUrl: resolveImageUrl(val)
                            });
                            setIsDirty(true);
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono"
                          placeholder="例如：music.mp3 或 https://..."
                        />
                      </div>

                      {/* Cover Image */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <label className="text-xs font-bold text-gray-500">圖片：</label>
                        <input 
                          type="text" 
                          value={tempPlayerConfig.imageFileName || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTempPlayerConfig({
                              ...tempPlayerConfig,
                              imageFileName: val,
                              imageUrl: resolveImageUrl(val)
                            });
                            setIsDirty(true);
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono"
                          placeholder="例如：FB_IMG_1749826495034.jpg 或 https://..."
                        />
                      </div>

                      {/* Volume Slider */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <label className="text-xs font-bold text-gray-500">音量：</label>
                        <div className="flex gap-3 items-center">
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={tempPlayerConfig.volume}
                            onChange={(e) => {
                              setTempPlayerConfig({
                                ...tempPlayerConfig,
                                volume: parseInt(e.target.value, 10)
                              });
                              setIsDirty(true);
                            }}
                            className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#8a7f9c]"
                          />
                          <span className="text-xs font-bold text-gray-600 w-12 text-right">{tempPlayerConfig.volume}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0">
                      <button 
                        onClick={handleCloseRequest}
                        className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => {
                          setPlayerConfig(tempPlayerConfig);
                          saveFieldToFirebase('playerConfig', tempPlayerConfig);
                          setIsDirty(false);
                          setActiveEditSection(null);
                        }}
                        className="px-5 py-1.5 bg-[#8a7f9c] hover:bg-[#746db5] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        儲存
                      </button>
                    </div>
                  </div>
                ) : activeEditSection === '序言' && tempPrefaceConfig ? (
                  <div className="flex-grow flex flex-col justify-start items-stretch text-left overflow-hidden">
                    <div className="space-y-4 overflow-y-auto pr-2 flex-grow max-h-[55vh] flex flex-col">
                      {/* Line 1 */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <label className="text-xs font-bold text-gray-500">句 1：</label>
                        <input 
                          type="text"
                          value={tempPrefaceConfig.line1}
                          onChange={(e) => {
                            setTempPrefaceConfig({ ...tempPrefaceConfig, line1: e.target.value });
                            setIsDirty(true);
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8a7f9c] text-xs font-semibold"
                          placeholder="例如：這是關於面臨困境的青少年們"
                        />
                      </div>

                      {/* Line 2 */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <label className="text-xs font-bold text-gray-500">句 2：</label>
                        <input 
                          type="text"
                          value={tempPrefaceConfig.line2}
                          onChange={(e) => {
                            setTempPrefaceConfig({ ...tempPrefaceConfig, line2: e.target.value });
                            setIsDirty(true);
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8a7f9c] text-xs font-semibold"
                          placeholder="例如：如何成長的故事"
                        />
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0">
                      <button 
                        onClick={handleCloseRequest}
                        className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => {
                          setPrefaceConfig(tempPrefaceConfig);
                          saveFieldToFirebase('line1', tempPrefaceConfig.line1);
                          saveFieldToFirebase('line2', tempPrefaceConfig.line2);
                          setIsDirty(false);
                          setActiveEditSection(null);
                        }}
                        className="px-5 py-1.5 bg-[#8a7f9c] hover:bg-[#746db5] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        儲存
                      </button>
                    </div>
                  </div>
                ) : activeEditSection === '計時器' && tempTargetDateStr !== null ? (
                  <div className="flex-grow flex flex-col justify-start items-stretch text-left overflow-hidden">
                    <div className="space-y-4 overflow-y-auto pr-2 flex-grow max-h-[55vh] flex flex-col">
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <label className="text-xs font-bold text-gray-500">設定目標日期：</label>
                        <input 
                          type="text"
                          value={tempTargetDateStr}
                          onChange={(e) => {
                            setTempTargetDateStr(e.target.value);
                            setIsDirty(true);
                          }}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8a7f9c] text-xs font-mono placeholder-gray-400/50 ${isValidDateStr(tempTargetDateStr) ? 'border-gray-200 text-gray-700' : 'border-red-300 bg-red-50/20 text-red-700'}`}
                          placeholder="YYYY/MM/DD"
                        />
                        {!isValidDateStr(tempTargetDateStr) && (
                          <p className="text-[10px] text-red-500 font-medium mt-1">
                            請輸入完整的 YYYY/MM/DD 格式日期（例如：2025/05/27）
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0">
                      <button 
                        onClick={handleCloseRequest}
                        className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        取消
                      </button>
                      <button 
                        onClick={() => {
                          if (isValidDateStr(tempTargetDateStr)) {
                            setTargetDateStr(tempTargetDateStr);
                            saveFieldToFirebase('targetDateStr', tempTargetDateStr);
                            setIsDirty(false);
                            setActiveEditSection(null);
                          }
                        }}
                        disabled={!isValidDateStr(tempTargetDateStr)}
                        className={`px-5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${isValidDateStr(tempTargetDateStr) ? 'bg-[#8a7f9c] hover:bg-[#746db5] text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                      >
                        儲存
                      </button>
                    </div>
                  </div>
                ) : activeEditSection === '學院檔案' && tempObservationState ? ( (() => {
                  const data = tempObservationState.find(c => c.id === editingCharId);
                  if (!data) return null;
                  const current = editingIsGraduated ? data.graduate : data.freshman;
                  const isCorrupted = data.isYvel && editingIsGraduated;

                  return (
                    <div className="flex-grow flex flex-col justify-start items-stretch text-left overflow-hidden">
                      <div className="flex-grow overflow-y-auto pr-2 pb-4 max-h-[60vh]">
                        {/* Render the ObservationCard editor with matching styling */}
                        <div className={`observation-card relative select-none ${isCorrupted ? 'corrupted' : ''}`} style={{ 
                          '--P': isCorrupted ? '#ff4d4d' : data.colors.P, 
                          '--A': isCorrupted ? '#666' : data.colors.A, 
                          '--H': isCorrupted ? '#000' : data.colors.H, 
                          '--Q': isCorrupted ? '#eee' : data.colors.Q, 
                          '--B': isCorrupted ? '#444' : data.colors.B,
                          boxShadow: 'none',
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                          margin: '5px auto',
                          padding: '40px 30px'
                        } as React.CSSProperties}>
                          
                          <div className="file-header">
                            {isCorrupted ? "◈ WARNING: SYSTEM ERROR ◈" : (data.isYvel ? "STUDENT FILE 00" : "STUDENT FILE")}
                          </div>

                          <div className="card-controls">
                            {!data.noToggle && (
                              <button className="toggle-btn mr-2" onClick={() => {
                                setEditingIsGraduated(!editingIsGraduated);
                                setIsDirty(true);
                              }}>
                                {data.isYvel 
                                  ? (editingIsGraduated ? "RESTORE: ???" : "OBSERVE: 入學") 
                                  : `OBSERVE: ${editingIsGraduated ? "畢業" : "入學"}`}
                              </button>
                            )}
                            <button className="toggle-btn" onClick={() => setShowEditSelector(true)}>
                              切換檔案
                            </button>
                          </div>

                          <div className="name-container">
                            {/* Editable nameZh */}
                            <input 
                              type="text"
                              value={data.nameZh || ""}
                              onChange={(e) => {
                                const updated = [...tempObservationState];
                                const targetIdx = updated.findIndex(c => c.id === editingCharId);
                                if (targetIdx !== -1) {
                                  updated[targetIdx].nameZh = e.target.value;
                                  setTempObservationState(updated);
                                  setIsDirty(true);
                                }
                              }}
                              className="name-zh bg-transparent border-b border-dashed border-gray-300 focus:border-[#8a7f9c] focus:outline-none w-full !text-2xl font-black py-0.5"
                              style={{ color: isCorrupted ? '#ff4d4d' : data.colors.P }}
                            />
                            {/* Editable nameEn */}
                            <input 
                              type="text"
                              value={data.nameEn || ""}
                              onChange={(e) => {
                                const updated = [...tempObservationState];
                                const targetIdx = updated.findIndex(c => c.id === editingCharId);
                                if (targetIdx !== -1) {
                                  updated[targetIdx].nameEn = e.target.value;
                                  setTempObservationState(updated);
                                  setIsDirty(true);
                                }
                              }}
                              className="name-en bg-transparent border-b border-dashed border-gray-200 focus:border-[#8a7f9c] focus:outline-none w-full !text-sm mt-1 py-0.5 animate-none uppercase"
                              style={{ color: isCorrupted ? '#666' : data.colors.A }}
                            />
                          </div>

                          <div className="quote">
                            {/* Editable quote */}
                            <textarea
                              value={current.quote || ""}
                              onChange={(e) => {
                                const updated = [...tempObservationState];
                                const targetIdx = updated.findIndex(c => c.id === editingCharId);
                                if (targetIdx !== -1) {
                                  if (editingIsGraduated) {
                                    updated[targetIdx].graduate.quote = e.target.value;
                                  } else {
                                    updated[targetIdx].freshman.quote = e.target.value;
                                  }
                                  setTempObservationState(updated);
                                  setIsDirty(true);
                                }
                              }}
                              rows={2}
                              className="bg-transparent focus:outline-none w-full text-sm font-medium italic border-b border-dashed border-gray-200 focus:border-[#8a7f9c] p-1"
                              style={{ color: isCorrupted ? '#eee' : data.colors.Q }}
                            />
                          </div>

                          <div className="stats-grid">
                            <div className="stat-group">
                              <div className="stat-item !opacity-100 !transform-none">
                                <span className="stat-label">擅長屬性</span>
                                <input 
                                  type="text"
                                  value={current.attr || ""}
                                  onChange={(e) => {
                                    const updated = [...tempObservationState];
                                    const targetIdx = updated.findIndex(c => c.id === editingCharId);
                                    if (targetIdx !== -1) {
                                      if (editingIsGraduated) {
                                        updated[targetIdx].graduate.attr = e.target.value;
                                      } else {
                                        updated[targetIdx].freshman.attr = e.target.value;
                                      }
                                      setTempObservationState(updated);
                                      setIsDirty(true);
                                    }
                                  }}
                                  className="stat-value bg-transparent border-b border-dashed border-gray-200 focus:border-[#8a7f9c] focus:outline-none w-full !text-[15px] font-bold py-0.5"
                                  style={{ color: isCorrupted ? '#ff4d4d' : data.colors.P }}
                                />
                              </div>
                              <div className="stat-item !opacity-100 !transform-none">
                                <span className="stat-label">魔力總量</span>
                                <input 
                                  type="text"
                                  value={current.mana || ""}
                                  onChange={(e) => {
                                    const updated = [...tempObservationState];
                                    const targetIdx = updated.findIndex(c => c.id === editingCharId);
                                    if (targetIdx !== -1) {
                                      if (editingIsGraduated) {
                                        updated[targetIdx].graduate.mana = e.target.value;
                                      } else {
                                        updated[targetIdx].freshman.mana = e.target.value;
                                      }
                                      setTempObservationState(updated);
                                      setIsDirty(true);
                                    }
                                  }}
                                  className="stat-value bg-transparent border-b border-dashed border-gray-200 focus:border-[#8a7f9c] focus:outline-none w-full !text-[15px] font-bold py-0.5"
                                  style={{ color: isCorrupted ? '#ff4d4d' : data.colors.P }}
                                />
                              </div>
                              <div className="stat-item !opacity-100 !transform-none">
                                <span className="stat-label">魔法穩定性</span>
                                <input 
                                  type="text"
                                  value={current.stability || ""}
                                  onChange={(e) => {
                                    const updated = [...tempObservationState];
                                    const targetIdx = updated.findIndex(c => c.id === editingCharId);
                                    if (targetIdx !== -1) {
                                      if (editingIsGraduated) {
                                        updated[targetIdx].graduate.stability = e.target.value;
                                      } else {
                                        updated[targetIdx].freshman.stability = e.target.value;
                                      }
                                      setTempObservationState(updated);
                                      setIsDirty(true);
                                    }
                                  }}
                                  className="stat-value bg-transparent border-b border-dashed border-gray-200 focus:border-[#8a7f9c] focus:outline-none w-full !text-[15px] font-bold py-0.5"
                                  style={{ color: isCorrupted ? '#ff4d4d' : data.colors.P }}
                                />
                              </div>
                            </div>

                            <div className="stat-group">
                              <div className="stat-item !opacity-100 !transform-none">
                                <span className="stat-label">劍術資質</span>
                                <input 
                                  type="text"
                                  value={current.talent || ""}
                                  onChange={(e) => {
                                    const updated = [...tempObservationState];
                                    const targetIdx = updated.findIndex(c => c.id === editingCharId);
                                    if (targetIdx !== -1) {
                                      if (editingIsGraduated) {
                                        updated[targetIdx].graduate.talent = e.target.value;
                                      } else {
                                        updated[targetIdx].freshman.talent = e.target.value;
                                      }
                                      setTempObservationState(updated);
                                      setIsDirty(true);
                                    }
                                  }}
                                  className="stat-value bg-transparent border-b border-dashed border-gray-200 focus:border-[#8a7f9c] focus:outline-none w-full !text-[15px] font-bold py-0.5"
                                  style={{ color: isCorrupted ? '#ff4d4d' : data.colors.P }}
                                />
                              </div>
                              <div className="stat-item !opacity-100 !transform-none">
                                <span className="stat-label">劍術能力</span>
                                <input 
                                  type="text"
                                  value={current.ability || ""}
                                  onChange={(e) => {
                                    const updated = [...tempObservationState];
                                    const targetIdx = updated.findIndex(c => c.id === editingCharId);
                                    if (targetIdx !== -1) {
                                      if (editingIsGraduated) {
                                        updated[targetIdx].graduate.ability = e.target.value;
                                      } else {
                                        updated[targetIdx].freshman.ability = e.target.value;
                                      }
                                      setTempObservationState(updated);
                                      setIsDirty(true);
                                    }
                                  }}
                                  className="stat-value bg-transparent border-b border-dashed border-gray-200 focus:border-[#8a7f9c] focus:outline-none w-full !text-[15px] font-bold py-0.5"
                                  style={{ color: isCorrupted ? '#ff4d4d' : data.colors.P }}
                                />
                              </div>
                              <div className="stat-item !opacity-100 !transform-none">
                                <span className="stat-label">魔獸：</span>
                                <input 
                                  type="text"
                                  value={current.beastSync || ""}
                                  onChange={(e) => {
                                    const updated = [...tempObservationState];
                                    const targetIdx = updated.findIndex(c => c.id === editingCharId);
                                    if (targetIdx !== -1) {
                                      if (editingIsGraduated) {
                                        updated[targetIdx].graduate.beastSync = e.target.value;
                                      } else {
                                        updated[targetIdx].freshman.beastSync = e.target.value;
                                      }
                                      setTempObservationState(updated);
                                      setIsDirty(true);
                                    }
                                  }}
                                  className="stat-value bg-transparent border-b border-dashed border-gray-200 focus:border-[#8a7f9c] focus:outline-none w-full !text-[15px] font-bold py-0.5"
                                  style={{ color: isCorrupted ? '#ff4d4d' : data.colors.P }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Nested Edit selector for picking character within editing screen */}
                          {showEditSelector && (
                            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-[150] p-6 flex flex-col justify-start overflow-y-auto rounded-lg">
                              <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-4">
                                <span className="text-sm font-bold text-gray-700">選擇編輯角色</span>
                                <button 
                                  onClick={() => setShowEditSelector(false)} 
                                  className="text-gray-400 hover:text-gray-600 text-sm font-bold cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {tempObservationState.map((c) => (
                                  <button
                                    key={c.id}
                                    onClick={() => {
                                      setEditingCharId(c.id);
                                      setIsDirty(true);
                                      setShowEditSelector(false);
                                    }}
                                    className={`px-3 py-2 text-left transition-all rounded-md cursor-pointer border ${
                                      editingCharId === c.id 
                                        ? 'font-bold' 
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    style={{
                                      borderColor: editingCharId === c.id ? c.colors.P : '#e5e7eb',
                                      backgroundColor: editingCharId === c.id ? `${c.colors.P}0d` : '#ffffff',
                                      color: editingCharId === c.id ? c.colors.P : '#374151',
                                    }}
                                  >
                                    <div className="text-[11px] font-bold truncate">{c.nameZh}</div>
                                    <div className="text-[9px] opacity-60 font-mono truncate mt-0.5">{c.nameEn}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0 bg-white z-[200]">
                        <button 
                          onClick={handleCloseRequest}
                          className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          取消
                        </button>
                        <button 
                          onClick={handleSaveObservation}
                          className="px-5 py-1.5 bg-[#8a7f9c] hover:bg-[#746db5] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          儲存
                        </button>
                      </div>
                    </div>
                  );
                })()
                ) : activeEditSection === '角色介紹' && tempCharIntroState ? (
                  <div className="flex-grow flex flex-col justify-start items-stretch text-left overflow-hidden">
                    <div className="char-editor-tabs flex gap-2 mb-4 p-1 bg-gray-50 rounded-xl flex-shrink-0">
                      <button 
                        onClick={() => setCharIntroEditorTab('eleanora')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${charIntroEditorTab === 'eleanora' ? 'bg-[#8a7f9c] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                      >
                        ELEANORA
                      </button>
                      <button 
                        onClick={() => setCharIntroEditorTab('lucien')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${charIntroEditorTab === 'lucien' ? 'bg-[#8a7f9c] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                      >
                        LUCIEN
                      </button>
                      <button 
                        onClick={() => setCharIntroEditorTab('others')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${charIntroEditorTab === 'others' ? 'bg-[#8a7f9c] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                      >
                        其他
                      </button>
                    </div>

                    {charIntroEditorTab !== 'others' && (() => {
                      const key = charIntroEditorTab === 'eleanora' ? 'eleanora' : 'lucien';
                      const charData = tempCharIntroState[key];
                      if (!charData) return null;

                      return (
                        <div className="flex-grow flex flex-col justify-start items-stretch text-left overflow-hidden h-[55vh]">
                          <div className="space-y-4 overflow-y-auto pr-2 flex-grow">
                            
                            {/* Name input */}
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-gray-500">姓名：</label>
                              <input 
                                type="text"
                                value={charData.name || ""}
                                onChange={(e) => {
                                  const updated = { ...tempCharIntroState };
                                  updated[key].name = e.target.value;
                                  setTempCharIntroState(updated);
                                  setIsDirty(true);
                                }}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8a7f9c] text-xs text-gray-700"
                              />
                            </div>

                            {/* Image input & upload button */}
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-gray-500">圖片網址：</label>
                              <input 
                                type="text"
                                value={charData.imageUrl || ""}
                                onChange={(e) => {
                                  const updated = { ...tempCharIntroState };
                                  updated[key].imageUrl = resolveImageUrl(e.target.value);
                                  setTempCharIntroState(updated);
                                  setIsDirty(true);
                                }}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8a7f9c] text-xs text-gray-700 font-mono"
                                placeholder="例如：IMG_5697.png 或 https://..."
                              />
                              {charData.imageUrl && (
                                <div className="mt-2 w-16 h-16 rounded border border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center">
                                  <img src={charData.imageUrl} alt="preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                              )}
                            </div>

                            {/* Sections editor */}
                            <div className="space-y-4">
                              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <span className="text-xs font-bold text-gray-500">資料章節：</span>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const title = prompt("請輸入新章節的標題（例如：外貌與穿著、個性特質）：");
                                    if (title) {
                                      const updated = { ...tempCharIntroState };
                                      if (!updated[key].sections) updated[key].sections = [];
                                      updated[key].sections.push({ title, items: ["新介紹項目"] });
                                      setTempCharIntroState(updated);
                                      setIsDirty(true);
                                    }
                                  }}
                                  className="text-xs text-[#8a7f9c] hover:text-[#746db5] font-semibold cursor-pointer"
                                >
                                  + 新增章節
                                </button>
                              </div>

                              {charData.sections?.map((sec: any, sIdx: number) => (
                                <div key={sIdx} className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 relative space-y-2">
                                  <div className="flex justify-between items-center gap-2">
                                    <input 
                                      type="text"
                                      value={sec.title}
                                      onChange={(e) => {
                                        const updated = { ...tempCharIntroState };
                                        updated[key].sections[sIdx].title = e.target.value;
                                        setTempCharIntroState(updated);
                                        setIsDirty(true);
                                      }}
                                      className="font-bold text-xs text-gray-700 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#8a7f9c] focus:outline-none focus:bg-white px-1 py-0.5"
                                    />
                                    <div className="flex items-center gap-1.5">
                                      <button 
                                        type="button"
                                        disabled={sIdx === 0}
                                        onClick={() => {
                                          const updated = { ...tempCharIntroState };
                                          const temp = updated[key].sections[sIdx];
                                          updated[key].sections[sIdx] = updated[key].sections[sIdx - 1];
                                          updated[key].sections[sIdx - 1] = temp;
                                          setTempCharIntroState(updated);
                                          setIsDirty(true);
                                        }}
                                        className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-[10px] cursor-pointer"
                                        title="向上移動"
                                      >
                                        ▲
                                      </button>
                                      <button 
                                        type="button"
                                        disabled={sIdx === charData.sections.length - 1}
                                        onClick={() => {
                                          const updated = { ...tempCharIntroState };
                                          const temp = updated[key].sections[sIdx];
                                          updated[key].sections[sIdx] = updated[key].sections[sIdx + 1];
                                          updated[key].sections[sIdx + 1] = temp;
                                          setTempCharIntroState(updated);
                                          setIsDirty(true);
                                        }}
                                        className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-[10px] cursor-pointer"
                                        title="向下移動"
                                      >
                                        ▼
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          if (confirm(`確定要刪除整個章節「${sec.title}」嗎？`)) {
                                            const updated = { ...tempCharIntroState };
                                            updated[key].sections.splice(sIdx, 1);
                                            setTempCharIntroState(updated);
                                            setIsDirty(true);
                                          }
                                        }}
                                        className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                                        title="刪除章節"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>

                                  <div className="space-y-2 mt-2">
                                    {sec.items?.map((item: string, iIdx: number) => (
                                      <div key={iIdx} className="flex gap-2 items-start bg-white p-2 rounded-lg border border-gray-100">
                                        <textarea
                                          value={item}
                                          onChange={(e) => {
                                            const updated = { ...tempCharIntroState };
                                            updated[key].sections[sIdx].items[iIdx] = e.target.value;
                                            setTempCharIntroState(updated);
                                            setIsDirty(true);
                                          }}
                                          rows={2}
                                          className="flex-grow text-xs text-gray-600 focus:outline-none resize-none font-sans"
                                        />
                                        <div className="flex flex-col gap-1 flex-shrink-0">
                                          <button 
                                            type="button"
                                            disabled={iIdx === 0}
                                            onClick={() => {
                                              const updated = { ...tempCharIntroState };
                                              const temp = updated[key].sections[sIdx].items[iIdx];
                                              updated[key].sections[sIdx].items[iIdx] = updated[key].sections[sIdx].items[iIdx - 1];
                                              updated[key].sections[sIdx].items[iIdx - 1] = temp;
                                              setTempCharIntroState(updated);
                                              setIsDirty(true);
                                            }}
                                            className="text-gray-400 hover:text-gray-600 text-[9px] disabled:opacity-20 cursor-pointer"
                                          >
                                            ▲
                                          </button>
                                          <button 
                                            type="button"
                                            disabled={iIdx === sec.items.length - 1}
                                            onClick={() => {
                                              const updated = { ...tempCharIntroState };
                                              const temp = updated[key].sections[sIdx].items[iIdx];
                                              updated[key].sections[sIdx].items[iIdx] = updated[key].sections[sIdx].items[iIdx + 1];
                                              updated[key].sections[sIdx].items[iIdx + 1] = temp;
                                              setTempCharIntroState(updated);
                                              setIsDirty(true);
                                            }}
                                            className="text-gray-400 hover:text-gray-600 text-[9px] disabled:opacity-20 cursor-pointer"
                                          >
                                            ▼
                                          </button>
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              const updated = { ...tempCharIntroState };
                                              updated[key].sections[sIdx].items.splice(iIdx, 1);
                                              setTempCharIntroState(updated);
                                              setIsDirty(true);
                                            }}
                                            className="text-red-400 hover:text-red-600 text-xs font-bold mt-1 cursor-pointer"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        const updated = { ...tempCharIntroState };
                                        updated[key].sections[sIdx].items.push("新項目描述");
                                        setTempCharIntroState(updated);
                                        setIsDirty(true);
                                      }}
                                      className="text-[11px] text-[#8a7f9c] hover:text-[#746db5] font-semibold mt-1 cursor-pointer flex items-center gap-1"
                                    >
                                      + 新增描述項目
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0 bg-white">
                            <button 
                              onClick={handleCloseRequest}
                              className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              取消
                            </button>
                            <button 
                              onClick={handleSaveCharacterIntro}
                              className="px-5 py-1.5 bg-[#8a7f9c] hover:bg-[#746db5] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              儲存
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {charIntroEditorTab === 'others' && (
                      <div className="flex-grow flex flex-col justify-start items-stretch text-left overflow-hidden h-[55vh]">
                        <div className="space-y-4 overflow-y-auto pr-2 flex-grow">
                          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <span className="text-xs font-bold text-gray-500">其他配角列表：</span>
                            <button 
                              type="button"
                              onClick={() => {
                                const updated = { ...tempCharIntroState };
                                if (!updated.others) updated.others = [];
                                updated.others.push({
                                  name: "新角色姓名",
                                  avatarUrl: "",
                                  descriptions: ["角色描述項目"]
                                });
                                setTempCharIntroState(updated);
                                setIsDirty(true);
                              }}
                              className="text-xs text-[#8a7f9c] hover:text-[#746db5] font-semibold cursor-pointer"
                            >
                              + 新增配角
                            </button>
                          </div>

                          {tempCharIntroState.others?.map((other: any, oIdx: number) => (
                            <div key={oIdx} className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 space-y-3 relative">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-400">角色 #{oIdx + 1}</span>
                                <div className="flex items-center gap-1.5">
                                  <button 
                                    type="button"
                                    disabled={oIdx === 0}
                                    onClick={() => {
                                      const updated = { ...tempCharIntroState };
                                      const temp = updated.others[oIdx];
                                      updated.others[oIdx] = updated.others[oIdx - 1];
                                      updated.others[oIdx - 1] = temp;
                                      setTempCharIntroState(updated);
                                      setIsDirty(true);
                                    }}
                                    className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-[10px] cursor-pointer"
                                  >
                                    ▲
                                  </button>
                                  <button 
                                    type="button"
                                    disabled={oIdx === tempCharIntroState.others.length - 1}
                                    onClick={() => {
                                      const updated = { ...tempCharIntroState };
                                      const temp = updated.others[oIdx];
                                      updated.others[oIdx] = updated.others[oIdx + 1];
                                      updated.others[oIdx + 1] = temp;
                                      setTempCharIntroState(updated);
                                      setIsDirty(true);
                                    }}
                                    className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-[10px] cursor-pointer"
                                  >
                                    ▼
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`確定要刪除角色「${other.name}」嗎？`)) {
                                        const updated = { ...tempCharIntroState };
                                        updated.others.splice(oIdx, 1);
                                        setTempCharIntroState(updated);
                                        setIsDirty(true);
                                      }
                                    }}
                                    className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-gray-500">姓名：</label>
                                <input 
                                  type="text"
                                  value={other.name}
                                  onChange={(e) => {
                                    const updated = { ...tempCharIntroState };
                                    updated.others[oIdx].name = e.target.value;
                                    setTempCharIntroState(updated);
                                    setIsDirty(true);
                                  }}
                                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8a7f9c] text-xs text-gray-700"
                                />
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-gray-500">頭像網址：</label>
                                  <input 
                                    type="text"
                                    value={other.avatarUrl || ""}
                                    onChange={(e) => {
                                      const updated = { ...tempCharIntroState };
                                      updated.others[oIdx].avatarUrl = resolveImageUrl(e.target.value);
                                      setTempCharIntroState(updated);
                                      setIsDirty(true);
                                    }}
                                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8a7f9c] text-xs text-gray-700 font-mono"
                                    placeholder="例如：IMG_5697.png 或 https://..."
                                  />
                                {other.avatarUrl && (
                                  <div className="mt-1 w-10 h-10 rounded-full border border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center">
                                    <img src={other.avatarUrl} alt="preview" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500">描述項目：</label>
                                {other.descriptions?.map((desc: string, dIdx: number) => (
                                  <div key={dIdx} className="flex gap-2 items-start bg-white p-2 rounded-lg border border-gray-100">
                                    <textarea
                                      value={desc}
                                      onChange={(e) => {
                                        const updated = { ...tempCharIntroState };
                                        updated.others[oIdx].descriptions[dIdx] = e.target.value;
                                        setTempCharIntroState(updated);
                                        setIsDirty(true);
                                      }}
                                      rows={2}
                                      className="flex-grow text-xs text-gray-600 focus:outline-none resize-none font-sans"
                                    />
                                    <div className="flex flex-col gap-1 flex-shrink-0">
                                      <button 
                                        type="button"
                                        disabled={dIdx === 0}
                                        onClick={() => {
                                          const updated = { ...tempCharIntroState };
                                          const temp = updated.others[oIdx].descriptions[dIdx];
                                          updated.others[oIdx].descriptions[dIdx] = updated.others[oIdx].descriptions[dIdx - 1];
                                          updated.others[oIdx].descriptions[dIdx - 1] = temp;
                                          setTempCharIntroState(updated);
                                          setIsDirty(true);
                                        }}
                                        className="text-gray-400 hover:text-gray-600 text-[9px] disabled:opacity-20 cursor-pointer"
                                      >
                                        ▲
                                      </button>
                                      <button 
                                        type="button"
                                        disabled={dIdx === other.descriptions.length - 1}
                                        onClick={() => {
                                          const updated = { ...tempCharIntroState };
                                          const temp = updated.others[oIdx].descriptions[dIdx];
                                          updated.others[oIdx].descriptions[dIdx] = updated.others[oIdx].descriptions[dIdx + 1];
                                          updated.others[oIdx].descriptions[dIdx + 1] = temp;
                                          setTempCharIntroState(updated);
                                          setIsDirty(true);
                                        }}
                                        className="text-gray-400 hover:text-gray-600 text-[9px] disabled:opacity-20 cursor-pointer"
                                      >
                                        ▼
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          const updated = { ...tempCharIntroState };
                                          updated.others[oIdx].descriptions.splice(dIdx, 1);
                                          setTempCharIntroState(updated);
                                          setIsDirty(true);
                                        }}
                                        className="text-red-400 hover:text-red-600 text-xs font-bold mt-1 cursor-pointer"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const updated = { ...tempCharIntroState };
                                    updated.others[oIdx].descriptions.push("新配角描述項目");
                                    setTempCharIntroState(updated);
                                    setIsDirty(true);
                                  }}
                                  className="text-[11px] text-[#8a7f9c] hover:text-[#746db5] font-semibold mt-1 cursor-pointer flex items-center gap-1"
                                >
                                  + 新增描述
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0 bg-white">
                          <button 
                            onClick={handleCloseRequest}
                            className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            取消
                          </button>
                          <button 
                            onClick={handleSaveCharacterIntro}
                            className="px-5 py-1.5 bg-[#8a7f9c] hover:bg-[#746db5] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            儲存
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : activeEditSection === '角色趣聞' && tempTriviaList ? (
                  <div className="flex-grow flex flex-col justify-start items-stretch text-left overflow-hidden">
                    <div className="space-y-4 overflow-y-auto pr-2 flex-grow max-h-[55vh] pb-4">
                      {tempTriviaList.map((trivia, idx) => (
                        <div key={idx} className="flex flex-col gap-1.5 p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400">趣聞 #{idx + 1}</span>
                            <button
                              onClick={() => {
                                const updated = tempTriviaList.filter((_, i) => i !== idx);
                                setTempTriviaList(updated);
                                setIsDirty(true);
                              }}
                              className="text-red-400 hover:text-red-600 text-xs font-bold cursor-pointer"
                              title="刪除此趣聞"
                            >
                              ✕ 刪除
                            </button>
                          </div>
                          <textarea
                            value={trivia}
                            onChange={(e) => {
                              const updated = [...tempTriviaList];
                              updated[idx] = e.target.value;
                              setTempTriviaList(updated);
                              setIsDirty(true);
                            }}
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-xs text-gray-700 bg-white"
                            rows={2}
                            placeholder="請輸入趣聞描述..."
                          />
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          const updated = [...tempTriviaList, "新趣聞內容描述..."];
                          setTempTriviaList(updated);
                          setIsDirty(true);
                        }}
                        className="w-full py-3 border-2 border-dashed border-gray-200 hover:border-[#8a7f9c] text-gray-500 hover:text-[#8a7f9c] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer bg-white"
                      >
                        + 新增趣聞
                      </button>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0 bg-white">
                      <button 
                        onClick={handleCloseRequest}
                        className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        取消
                      </button>
                      <button 
                        onClick={handleSaveTrivia}
                        className="px-5 py-1.5 bg-[#8a7f9c] hover:bg-[#746db5] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        儲存
                      </button>
                    </div>
                  </div>
                ) : activeEditSection === '檔案資訊補充' && tempSupplementList ? (
                  <SupplementEditor
                    tempSupplementList={tempSupplementList}
                    setTempSupplementList={setTempSupplementList}
                    editingSupplementIndex={editingSupplementIndex}
                    setEditingSupplementIndex={setEditingSupplementIndex}
                    handleCloseRequest={handleCloseRequest}
                    handleSaveSupplement={handleSaveSupplement}
                    setIsDirty={setIsDirty}
                  />
                ) : activeEditSection === '文章影片播放器' && tempVideoList ? ( (() => {
                  const currentVideo = tempVideoList[editingVideoIndex] || tempVideoList[0];

                  return (
                    <div className="flex-grow flex flex-col justify-start items-stretch text-left overflow-hidden">
                      {/* Top video tabs row */}
                      <div className="flex items-center gap-2 mb-4 p-1 bg-gray-50 rounded-xl overflow-x-auto flex-shrink-0">
                        {tempVideoList.map((video, idx) => (
                          <button
                            key={idx}
                            onClick={() => setEditingVideoIndex(idx)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${editingVideoIndex === idx ? 'bg-[#8a7f9c] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 bg-white/50'}`}
                          >
                            {video.title || `影片 #${idx + 1}`}
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            const newVideo = {
                              id: `video-${Date.now()}`,
                              title: "new_video",
                              videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                              fileName: "ForBiggerBlazes.mp4",
                              lyrics: []
                            };
                            const updated = [...tempVideoList, newVideo];
                            setTempVideoList(updated);
                            setEditingVideoIndex(updated.length - 1);
                            setIsDirty(true);
                          }}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all cursor-pointer"
                        >
                          + 新增
                        </button>
                      </div>

                      {/* Video detail details form */}
                      {currentVideo ? (
                        <div className="space-y-4 overflow-y-auto pr-2 flex-grow max-h-[50vh] flex flex-col">
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500">標題 (Title)</label>
                            <input 
                              type="text"
                              value={currentVideo.title || ""}
                              onChange={(e) => {
                                const updated = [...tempVideoList];
                                updated[editingVideoIndex].title = e.target.value;
                                setTempVideoList(updated);
                                setIsDirty(true);
                              }}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-700"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500">影片連結 (Video URL)</label>
                            <input 
                              type="text"
                              value={currentVideo.videoUrl || ""}
                              onChange={(e) => {
                                const url = e.target.value;
                                const fileName = url.substring(url.lastIndexOf('/') + 1) || "video.mp4";
                                const updated = [...tempVideoList];
                                updated[editingVideoIndex].videoUrl = url;
                                updated[editingVideoIndex].fileName = fileName;
                                setTempVideoList(updated);
                                setIsDirty(true);
                              }}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-700 font-mono"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500">影片檔名 (Video Filename)</label>
                            <input 
                              type="text"
                              disabled
                              value={currentVideo.fileName || ""}
                              className="w-full px-3 py-2 border border-gray-100 rounded-lg text-xs text-gray-400 bg-gray-50 font-mono"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400 text-xs italic">
                          尚無影片，請點擊「+」按鈕新增
                        </div>
                      )}

                      {/* Footer actions */}
                      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0">
                        {currentVideo && tempVideoList.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => {
                              const updated = tempVideoList.filter((_, idx) => idx !== editingVideoIndex);
                              setTempVideoList(updated);
                              setEditingVideoIndex(0);
                              setIsDirty(true);
                            }}
                            className="mr-auto px-4 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            刪除此影片
                          </button>
                        )}
                        <button 
                          onClick={handleCloseRequest}
                          className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          取消
                        </button>
                        <button 
                          onClick={handleSaveVideoList}
                          className="px-5 py-1.5 bg-[#8a7f9c] hover:bg-[#746db5] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          儲存
                        </button>
                      </div>
                    </div>
                  );
                })()
                ) : (
                  <div className="flex-grow flex flex-col justify-center items-center text-center p-4">
                    <div className="w-16 h-16 bg-[#bcbadb]/20 rounded-full flex items-center justify-center mb-4">
                      <span className="text-[#8a7f9c] text-2xl font-bold">✎</span>
                    </div>
                    <p className="text-gray-400 text-sm">目前編輯區塊暫不需配置專用欄位，已設定為預設全白視窗。</p>
                    <div className="mt-6 flex justify-end w-full">
                      <button 
                        onClick={() => setActiveEditSection(null)}
                        className="px-6 py-2 bg-[#8a7f9c] hover:bg-[#746db5] text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                      >
                        關閉
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Exit Unsaved Changes Confirmation Modal Overlay */}
              {showExitConfirm && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md rounded-2xl flex flex-col justify-center items-center p-6 z-[10002] text-center">
                  <div className="w-12 h-12 bg-amber-500/15 rounded-full flex items-center justify-center mb-3">
                    <span className="text-amber-500 text-xl font-bold">⚠️</span>
                  </div>
                  <h3 className="text-white font-bold text-base mb-2">您還未儲存編輯</h3>
                  <p className="text-gray-300 text-xs mb-6 max-w-xs leading-relaxed">確定要返回嗎？</p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        setIsDirty(false);
                        setShowExitConfirm(false);
                        setActiveEditSection(null);
                      }}
                      className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      是
                    </button>
                    <button 
                      onClick={() => setShowExitConfirm(false)}
                      className="px-5 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      否
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
