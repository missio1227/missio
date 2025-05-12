import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const app = express();
const PORT = 4000;
const JWT_SECRET = 'your_jwt_secret'; // 실제 배포시 환경변수로 관리

app.use(cors()); // 모든 오리진 허용 (최상단)
app.use(bodyParser.json());

// MongoDB 연결
const MONGO_URI = 'mongodb+srv://idwallet:pnJR2lGPffiC4Zxy@cluster0.bp9iwzi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// User 모델
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String
});
const User = mongoose.model('User', userSchema);

// Server 모델
const serverSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  ip: String,
  username: String,
  password: String,
  plainPassword: String,
  desc: String,
  favorite: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const Server = mongoose.model('Server', serverSchema);

// 회원가입
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '필수 항목 누락' });
  try {
    const hash = await bcrypt.hash(password, 10);
    await User.create({ username, password: hash });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: '이미 존재하는 사용자명입니다.' });
  }
});

// 로그인 (JWT 발급)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: '사용자 정보가 올바르지 않습니다.' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

// 인증 미들웨어
function auth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: '인증 필요' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: '토큰 없음' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: '유효하지 않은 토큰' });
  }
}

// 서버 목록 조회
app.get('/api/servers', auth, async (req, res) => {
  const servers = await Server.find({ user_id: req.userId });
  res.json(servers);
});

// 서버 추가
app.post('/api/servers', auth, async (req, res) => {
  const { name, ip, username, plainPassword, desc, favorite } = req.body;
  if (!plainPassword) {
    return res.status(400).json({ error: '비밀번호가 필요합니다.' });
  }
  const hash = await bcrypt.hash(plainPassword, 10);
  const now = new Date();
  await Server.create({
    user_id: req.userId,
    name,
    ip,
    username,
    password: hash,
    plainPassword,
    desc,
    favorite: !!favorite,
    createdAt: now,
    updatedAt: now
  });
  res.json({ success: true });
});

// 서버 수정
app.put('/api/servers/:id', auth, async (req, res) => {
  const { name, ip, username, plainPassword, desc, favorite } = req.body;
  const update = { name, ip, username, desc, favorite: !!favorite, updatedAt: new Date() };
  if (plainPassword) {
    update.password = await bcrypt.hash(plainPassword, 10);
    update.plainPassword = plainPassword;
  }
  await Server.updateOne({ _id: req.params.id, user_id: req.userId }, { $set: update });
  res.json({ success: true });
});

// 서버 삭제
app.delete('/api/servers/:id', auth, async (req, res) => {
  await Server.deleteOne({ _id: req.params.id, user_id: req.userId });
  res.json({ success: true });
});

// 즐겨찾기 토글
app.put('/api/servers/:id/favorite', auth, async (req, res) => {
  const server = await Server.findOne({ _id: req.params.id, user_id: req.userId });
  if (!server) return res.status(404).json({ error: '서버를 찾을 수 없음' });
  server.favorite = !server.favorite;
  await server.save();
  res.json({ success: true, favorite: server.favorite });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 