export interface User {
  id: string;
  name: string;
  email: string;
  role?: 'patient' | 'doctor';
  status?: 'active' | 'pending' | 'rejected';
  birthDate?: string;
  city?: string;
}

export interface Symptom {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  recommendations: string[];
}

export interface PatientExperience {
  id: string;
  title: string;
  summary: string;
  content: string;
  date: string;
  author: string;
}

export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  color: string;
  route: string;
}

export interface ContactForm {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export interface ExpertQuestion {
  id: string;
  type: 'text' | 'voice' | 'video';
  question: string;
  date: string;
  status: 'pending' | 'answered';
  answer?: string;
}
