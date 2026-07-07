const fs = require('fs');
const dotenv = require('dotenv');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

async function updateAd() {
  if (process.env.MONGODB_URI) {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const SystemSettingsSchema = new mongoose.Schema({}, { strict: false });
    const SystemSettings = mongoose.model('SystemSettings', SystemSettingsSchema, 'systemsettings');
    
    const aiAd = `
      <div style="width:100%;max-width:340px;margin:10px auto;padding:2px;border-radius:18px;background:linear-gradient(45deg,#ff007f,#7928ca,#4338ca,#06b6d4);background-size:300% 300%;animation:gradient-flow 4s ease infinite;box-shadow:0 12px 30px rgba(121,40,202,0.3);position:relative;overflow:hidden;font-family:system-ui,-apple-system,sans-serif;">
        <style>
          @keyframes gradient-flow{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
          @keyframes pulse-glow{0%,100%{opacity:0.6}50%{opacity:1}}
          @keyframes float-up{0%{transform:translateY(0px)}50%{transform:translateY(-4px)}100%{transform:translateY(0px)}}
          .ai-ad-btn:hover{transform:scale(1.05);background:#fff!important;color:#7928ca!important;}
        </style>
        <div style="position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(255,255,255,0.15) 0%,transparent 60%);animation:pulse-glow 3s infinite;"></div>
        <div style="background:#0f172a;border-radius:16px;padding:20px;text-align:center;position:relative;z-index:1;height:100%;">
          <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:12px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:float-up 3s ease-in-out infinite"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <span style="font-size:10px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;color:#06b6d4;">AI Sponsored</span>
          </div>
          <h3 style="font-size:18px;font-weight:800;color:#fff;margin:0 0 8px 0;line-height:1.2;background:linear-gradient(to right,#fff,#cbd5e1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Unlock True AI Potential</h3>
          <p style="font-size:13px;color:#94a3b8;margin:0 0 18px 0;line-height:1.4;">Supercharge your workflow with next-gen AI automation. Join 100K+ creators today.</p>
          <a href="#" class="ai-ad-btn" style="display:inline-block;padding:10px 24px;border-radius:24px;background:linear-gradient(90deg,#7928ca,#ff007f);color:#fff;font-size:13px;font-weight:800;text-decoration:none;letter-spacing:0.05em;transition:all 0.3s ease;box-shadow:0 4px 15px rgba(255,0,127,0.3);">START FREE TRIAL</a>
        </div>
      </div>
    `;

    const res = await SystemSettings.findOneAndUpdate({ key: 'adsense_code' }, { value: aiAd }, { upsert: true });
    console.log('Updated DB AdSense Code!');
    await mongoose.disconnect();
  }
}

updateAd().catch(console.error);
