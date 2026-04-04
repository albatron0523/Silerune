/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Data ---
const TRIVIA_DATABASE = [
  "爵位等第由高至低分別為：公爵、侯爵、伯爵、子爵、男爵。",
  "艾洛蒂有一位極其信任的執事，專門替她處理各類繁瑣的雜事。",
  "米蕾優是艾蕾諾菈唯一的「貼身」女僕，雖然府邸內還有多名普通女僕。",
  "艾蕾諾菈私下的愛好非常單純：看書與享用甜食。",
  "路西恩不喜歡運動類活動，更偏好演奏音樂等靜態活動。",
  "莉雪有一位弟弟，她從小就被賦予了「必須養成合格侯爵繼承人」的重責大任。",
  "米蕾優從小作為平民生活在農村，力氣大得驚人。",
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
    colors: { P: "#746ba1", A: "#968fbf", H: "#867db0", Q: "#625a8c", B: "#b8b4cf" },
    freshman: { quote: "「 開什麼玩笑！明明我才是繼承人！」", attr: "水", mana: "42%", stability: "35%", talent: "B", ability: "已開發 40%", beastSync: "蛇 默契度 15%" },
    graduate: { quote: "「 啊啊，你也跟我一樣，對吧？」", attr: "水", mana: "50%", stability: "67%", talent: "B", ability: "已開發 97%", beastSync: "蛇 默契度 83%" }
  },
  {
    id: 3,
    nameZh: "莉雪·瑟蘭",
    nameEn: "Lys Seranne",
    colors: { P: "#6a948e", A: "#8eb5b0", H: "#7da6a0", Q: "#53857e", B: "#b2cfcb" },
    freshman: { quote: "「 我真的不配入你的眼嗎？」", attr: "風", mana: "67%", stability: "70%", talent: "A", ability: "已開發 20%", beastSync: "獅鷹 默契度 63%" },
    graduate: { quote: "「 如果歷史從未發生，那就由我來創造。」", attr: "風", mana: "81%", stability: "79%", talent: "A", ability: "已開發 89%", beastSync: "獅鷹 默契度 84%" }
  },
  {
    id: 4,
    nameZh: "艾洛蒂·拉維涅",
    nameEn: "Elody Ravigny",
    colors: { P: "#b08698", A: "#c7a3b2", H: "#bd97a7", Q: "#9c7083", B: "#d6c5cb" },
    freshman: { quote: "「 」", attr: "風", mana: "74%", stability: "65%", talent: "B", ability: "已開發 15%", beastSync: "獨角獸 默契度 86%" },
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

// --- Components ---

const ObservationCard = ({ charId, onShuffle }: { charId: number, onShuffle: () => void }) => {
  const [isGraduated, setIsGraduated] = useState(false);
  const data = OBSERVATION_DATABASE.find(c => c.id === charId);
  if (!data) return null;

  const current = isGraduated ? data.graduate : data.freshman;
  const isCorrupted = (data as any).isYvel && isGraduated;

  return (
    <div className={`observation-card ${isCorrupted ? 'corrupted' : ''}`} style={{ 
      '--P': isCorrupted ? '#ff4d4d' : data.colors.P, 
      '--A': isCorrupted ? '#666' : data.colors.A, 
      '--H': isCorrupted ? '#000' : data.colors.H, 
      '--Q': isCorrupted ? '#eee' : data.colors.Q, 
      '--B': isCorrupted ? '#444' : data.colors.B 
    } as React.CSSProperties}>
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
        <button className="toggle-btn" onClick={onShuffle}>
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

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [wikiTab, setWikiTab] = useState('w1');
  const [charTab, setCharTab] = useState('c1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timer, setTimer] = useState("00 Days 00 Hours 00 Mins 00 Secs");
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [randomCharId, setRandomCharId] = useState(0);
  const [seenCharIds, setSeenCharIds] = useState<number[]>([]);
  const [currentTrivia, setCurrentTrivia] = useState("");
  const [triviaRotation, setTriviaRotation] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize random character and trivia
  useEffect(() => {
    const allIds = OBSERVATION_DATABASE.map(c => c.id);
    const randomId = allIds[Math.floor(Math.random() * allIds.length)];
    setRandomCharId(randomId);
    setSeenCharIds([randomId]);
    
    const randomTrivia = TRIVIA_DATABASE[Math.floor(Math.random() * TRIVIA_DATABASE.length)];
    setCurrentTrivia(randomTrivia);
    setTriviaRotation(Number((Math.random() * 4 - 2).toFixed(1)));
  }, []);

  const shuffleChar = () => {
    const allIds = OBSERVATION_DATABASE.map(c => c.id);
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
    const interval = setInterval(() => {
      const diff = new Date().getTime() - new Date(2025, 4, 28).getTime();
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff / 3600000) % 24);
      const m = Math.floor((diff / 60000) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimer(`${d} Days ${h} Hours ${m} Mins ${s} Secs`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Audio Logic
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
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
          <li className={`nav-item ${activeTab === 'home' ? 'active-nav' : ''}`} onClick={() => { setActiveTab('home'); setIsSidebarOpen(false); }}>HOME</li>
          <li className={`nav-item ${activeTab === 'char' ? 'active-nav' : ''}`} onClick={() => { setActiveTab('char'); setIsSidebarOpen(false); }}>CHARACTERS</li>
          <li className={`nav-item ${activeTab === 'art' ? 'active-nav' : ''}`} onClick={() => { setActiveTab('art'); setIsSidebarOpen(false); }}>GALLERY</li>
        </ul>
      </motion.div>

      {/* Menu Button */}
      <div id="menuBtn" onClick={() => setIsSidebarOpen(true)}>
        <div></div><div></div><div></div>
      </div>

      {/* Main Content */}
      <main className="w-full">
        {/* Tab: Home */}
        {activeTab === 'home' && (
          <div className="sub-page active">
            <div className="top-content">
              <div className={`player-container ${isPlaying ? 'playing' : ''}`} id="player">
                <div className="record-box">
                  <div className="record">
                    <div className="record-img"></div>
                  </div>
                </div>
                <div className="info-side">
                  <div className="font-bold text-[#8a7f9c] text-sm mb-1">《 蜜月アン・ドゥ・トロワ 》</div>
                  <div className="progress-wrapper" onClick={seek}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                  <div className="controls">
                    <div className="btn" onClick={() => audioRef.current && (audioRef.current.currentTime -= 10)}><SkipBack size={18} /></div>
                    <div className="btn" onClick={togglePlay}>
                      {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                    </div>
                    <div className="btn" onClick={() => audioRef.current && (audioRef.current.currentTime += 10)}><SkipForward size={18} /></div>
                    <div className="btn" onClick={() => audioRef.current && (audioRef.current.currentTime = 0)}><RotateCcw size={18} /></div>
                  </div>
                </div>
                <audio 
                  ref={audioRef}
                  src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/蜜月アン・ドゥ・トロワ_ DATEKEN 【ピアノカバー】_320k (1).mp3" 
                  loop 
                  onTimeUpdate={handleTimeUpdate}
                />
              </div>

              <div className="intro-section">
                <div className="line line-1">這是關於面臨困境的青少年們</div>
                <div className="line line-2">如何成長的故事</div>
              </div>

              <div className="timer-section">
                <div className="timer-label">Eleanora Cressel & Lucien Valemont</div>
                {timer}
              </div>

              <div className="wiki-section">
                <div className="tabs">
                  <div className={`tab-btn ${wikiTab === 'w1' ? 'active' : ''}`} onClick={() => setWikiTab('w1')}>✧༺ 世界觀 ༻✧</div>
                  <div className={`tab-btn ${wikiTab === 'w2' ? 'active' : ''}`} onClick={() => setWikiTab('w2')}>✧˖° 國家</div>
                  <div className={`tab-btn ${wikiTab === 'w3' ? 'active' : ''}`} onClick={() => setWikiTab('w3')}>✧˖° 家族</div>
                </div>
                <div className="wiki-content-area">
                  {wikiTab === 'w1' && (
                    <div className="content-pane active">
                      <h3>✧ 核心設定</h3>
                      ✦ 科技、階級、禮儀與普遍思想道德與中世紀歐洲相似，但仍有捏造成分<br />
                      ✦ 擁有魔法系統，黑市有蠻多魔藥與禁書的交易<br />
                      ✦ 魔法的原理是透過魔力操縱原子移動，但世人們並不知道「原子」的概念<br />
                      ✦ 黑魔法為操縱生物細胞（尤其神經細胞）的魔法，但這些魔法的使用途徑如果有經過法律認證的話就是合法的普通魔法（有點像是嗎啡能當麻醉也能當毒品的概念）<br />
                      ✦ 為避免幼兒不會控制魔力時就對生物使用魔力，所以嬰兒出生時都會施加魔法加以限制
                    </div>
                  )}
                  {wikiTab === 'w2' && (
                    <div className="content-pane active">
                      <h3>✧ 希鷺倫 (Silerune)</h3>
                      ✦ 北方強國，坐擁豐富擴產，因此工業發達<br />
                      ✦ 將「水」視為信仰，當作與上帝溝通的渠道，秋季的豐收季時會舉辦慶典「潤恩節」，皇帝會邀請水系魔法師上台表演，民間也會有大量的攤販舉國歡慶<br />
                      ✦ 有北方聖地「艾爾哈爾達（Eirhalda）」，氣候雖寒冷但仍有許多人來朝聖
                      <h3>✧ 瓦爾托梅爾 (Valtomere)</h3>
                      ✦ 南方強國，因氣候溫暖盛產農產<br />
                      ✦ 內鬥頻繁，治安不穩，黑魔法師較多
                    </div>
                  )}
                  {wikiTab === 'w3' && (
                    <div className="content-pane active">
                      <h3>✧ 克雷瑟家族 (Cressel)</h3>
                      ✦ 地位：公爵。財力雄厚，領地大。<br />
                      ✦ 公爵雷納德寵妻女但政治果斷，夫人長年臥病，僅有一女。
                      <h3>✧ 法雷蒙家族 (Valemont)</h3>
                      ✦ 地位：伯爵。前伯爵傑羅得犧牲，遺孤路西恩被公爵艾多里安收養。<br />
                      ✦ 養父母憎恨其光環，將路西恩訓練成完美少爺。<br />
                      ✦ 親子席昂因高壓教育成長，對路西恩有嫉妒心但心不壞。
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Character */}
        {activeTab === 'char' && (
          <div className="sub-page active">
            <div className="top-content">
              <div className="char-container">
                <ObservationCard charId={randomCharId} onShuffle={shuffleChar} />
                <div className="char-nav">
                  <div className={`char-node ${charTab === 'c1' ? 'active' : ''}`} onClick={() => setCharTab('c1')}>ELEANORA</div>
                  <div className={`char-node ${charTab === 'c2' ? 'active' : ''}`} onClick={() => setCharTab('c2')}>LUCIEN</div>
                  <div className={`char-node ${charTab === 'c3' ? 'active' : ''}`} onClick={() => setCharTab('c3')}>OTHERS</div>
                </div>
                <div className="char-scroll-area">
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
                        <div className="support-header">
                          <div className="support-avatar">
                            <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/無標題886_20250618214443.png" alt="Mireille" referrerPolicy="no-referrer" />
                          </div>
                          <span className="support-char-name">✧ 米蕾優·布朗雪</span>
                        </div>
                        <div>
                          ✦ 艾蕾諾菈的貼身女僕<br />
                          ✦ 溫和且是少數能讀懂艾蕾諾菈心意的人<br />
                          ✦ 過去是在農村成長的平民，力氣頗大也擅長家事
                        </div>
                      </div>

                      <div className="support-item">
                        <div className="support-header">
                          <div className="support-avatar">
                            <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/無標題913_20250708151336.png" alt="Licia" referrerPolicy="no-referrer" />
                          </div>
                          <span className="support-char-name">✧ 莉雪·瑟蘭</span>
                        </div>
                        <div>
                          ✦ 瑟蘭侯爵千金<br />
                          ✦ 家族長年與克雷瑟家不對付，並有野心吞噬對方<br />
                          ✦ 因家教+心儀路西恩對艾蕾諾菈心生嫉恨<br />
                          ✦ 擅長社交而擁有不少人脈
                        </div>
                      </div>

                      <div className="support-item">
                        <div className="support-header">
                          <div className="support-avatar">席恩</div>
                          <span className="support-char-name">✧ 席恩·法雷蒙</span>
                        </div>
                        <div>
                          ✦ 路西恩的表哥<br />
                          ✦ 被父母寵溺+寄予厚望，養成粗俗又自卑的個性，相比路西恩像還沒社會化的小孩<br />
                          ✦ 嫉妒路西恩所擁有的聲望與能力
                        </div>
                      </div>

                      <div className="support-item">
                        <div className="support-header">
                          <div className="support-avatar">
                            <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/無標題915_20260109111842.png" alt="Elody" referrerPolicy="no-referrer" />
                          </div>
                          <span className="support-char-name">✧ 艾洛蒂·拉維捏</span>
                        </div>
                        <div>
                          ✦ 瓦爾托梅爾的公爵千金<br />
                          ✦ 艾蕾諾菈的筆友，在學院與她第一次見面並迅速成為常常互動的朋友<br />
                          ✦ 率真靈活，擅長引導他人走出傷痛
                        </div>
                      </div>

                      <div className="support-item">
                        <div className="support-header">
                          <div className="support-avatar">伊維爾</div>
                          <span className="support-char-name">✧ 伊維爾·艾凡</span>
                        </div>
                        <div>
                          ✦ 魔法學院的校長，古老神話「奧雷菲斯・維洛恩」的後裔，有其遺物<br />
                          ✦ 小男孩，舉止跳脫古怪，常被誤會是一年級新生<br />
                          ✦ 魔法實力強大到足以滅國，被譽為「神之子」<br />
                          ✦ 據說是前校長去世前強推上位的，各國國王其實都怒不敢言
                        </div>
                      </div>

                      <div className="support-item">
                        <div className="support-header">
                          <div className="support-avatar">卡修斯</div>
                          <span className="support-char-name">✧ 卡修斯·塞西爾</span>
                        </div>
                        <div>
                          ✦ 希鷺倫的二王子<br />
                          ✦ 有野心並堅信自己未來會成為這個國家的國王<br />
                          ✦ 是真的會對自己的人民與政策有所行動，例如：提前制定社福政策、保護素未謀面的人民<br />
                          ✦ 喜歡艾蕾諾菈，並在明知她已訂婚的情況下試圖拉近距離。<br />
                          其實他只是認為艾蕾諾菈適合當王妃，但不自知那不是真的愛。
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Trivia Note */}
                <div className="flex justify-center py-10">
                  <div 
                    className="trivia-note animate" 
                    style={{ transform: `rotate(${triviaRotation}deg)` }}
                  >
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

        {/* Tab: Art */}
        {activeTab === 'art' && (
          <div className="sub-page active">
            <div className="gallery-outer">
              <div className="gallery-title">༺ GALLERY ༻</div>
              <div className="scroll-container">
                <div className="art-col col-portrait">
                  <div className="art-frame" onClick={() => setLightboxImg('https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/IMG_5697.png')}>
                    <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/IMG_5697.png" alt="Art" referrerPolicy="no-referrer" />
                  </div>
                </div>
                
                <div className="art-col col-stack">
                  <div className="art-frame" onClick={() => setLightboxImg('https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C951_20260118020109.png')}>
                    <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C951_20260118020109.png" alt="Art" referrerPolicy="no-referrer" />
                  </div>
                  <div className="art-frame" onClick={() => setLightboxImg('https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1067_20260118005441.png')}>
                    <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1067_20260118005441.png" alt="Art" referrerPolicy="no-referrer" />
                  </div>
                </div>

                <div className="art-col col-portrait">
                  <div className="art-frame" onClick={() => setLightboxImg('https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/FB_IMG_1749826495034.jpg')}>
                    <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/FB_IMG_1749826495034.jpg" alt="Art" referrerPolicy="no-referrer" />
                  </div>
                </div>

                <div className="art-col col-complex">
                  <div className="art-frame top-frame" onClick={() => setLightboxImg('https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1033_20260101025628.png')}>
                    <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1033_20260101025628.png" alt="Art" referrerPolicy="no-referrer" />
                  </div>
                  <div className="row-inner">
                    <div className="art-frame" onClick={() => setLightboxImg('https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1102_20260208235836.png')}>
                      <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1102_20260208235836.png" alt="Art" referrerPolicy="no-referrer" />
                    </div>
                    <div className="art-frame" onClick={() => setLightboxImg('https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1102_20260208235846.png')}>
                      <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1102_20260208235846.png" alt="Art" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                </div>

                <div className="art-col col-portrait">
                  <div className="art-frame" onClick={() => setLightboxImg('https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/FB_IMG_1769782908274.jpg')}>
                    <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/FB_IMG_1769782908274.jpg" alt="Art" referrerPolicy="no-referrer" />
                  </div>
                </div>

                <div className="art-col col-sq-pair">
                  <div className="art-frame" onClick={() => setLightboxImg('https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C933_20250810153340.png')}>
                    <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C933_20250810153340.png" alt="Art" referrerPolicy="no-referrer" />
                  </div>
                  <div className="art-frame" onClick={() => setLightboxImg('https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C933_20250811052051.png')}>
                    <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C933_20250811052051.png" alt="Art" referrerPolicy="no-referrer" />
                  </div>
                </div>

                <div className="art-col col-stack">
                  <div className="art-frame" onClick={() => setLightboxImg('https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C397_20251222082314.png')}>
                    <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C397_20251222082314.png" alt="Art" referrerPolicy="no-referrer" />
                  </div>
                  <div className="art-frame" onClick={() => setLightboxImg('https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C393_20251215195508.png')}>
                    <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C393_20251215195508.png" alt="Art" referrerPolicy="no-referrer" />
                  </div>
                </div>

                <div className="art-col col-portrait">
                  <div className="art-frame" onClick={() => setLightboxImg('https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1121_20260219211404.png')}>
                    <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1121_20260219211404.png" alt="Art" referrerPolicy="no-referrer" />
                  </div>
                </div>

                <div className="art-col col-stack">
                  <div className="art-frame" onClick={() => setLightboxImg('https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C887_20250622181052.png')}>
                    <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C887_20250622181052.png" alt="Art" referrerPolicy="no-referrer" />
                  </div>
                  <div className="art-frame" onClick={() => setLightboxImg('https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C887_20250622210234.png')}>
                    <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C887_20250622210234.png" alt="Art" referrerPolicy="no-referrer" />
                  </div>
                </div>

                <div className="art-col col-stack">
                  <div className="art-frame" onClick={() => setLightboxImg('https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1016_20251216121552.png')}>
                    <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1016_20251216121552.png" alt="Art" referrerPolicy="no-referrer" />
                  </div>
                  <div className="art-frame" onClick={() => setLightboxImg('https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1016_20251216090827.png')}>
                    <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1016_20251216090827.png" alt="Art" referrerPolicy="no-referrer" />
                  </div>
                </div>

                <div className="art-col col-portrait">
                  <div className="art-frame" onClick={() => setLightboxImg('https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C878_20250614021733.png')}>
                    <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C878_20250614021733.png" alt="Art" referrerPolicy="no-referrer" />
                  </div>
                </div>

                <div className="art-col col-portrait">
                  <div className="art-frame" onClick={() => setLightboxImg('https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1103_20260210015346.png')}>
                    <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1103_20260210015346.png" alt="Art" referrerPolicy="no-referrer" />
                  </div>
                </div>

                <div className="art-col col-stack">
                  <div className="art-frame" onClick={() => setLightboxImg('https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/FB_IMG_1751735099362.jpg')}>
                    <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/FB_IMG_1751735099362.jpg" alt="Art" referrerPolicy="no-referrer" />
                  </div>
                  <div className="art-frame" onClick={() => setLightboxImg('https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C860_20250618164117.png')}>
                    <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C860_20250618164117.png" alt="Art" referrerPolicy="no-referrer" />
                  </div>
                </div>
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
    </div>
  );
}
