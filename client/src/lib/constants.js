import { Code2, Github, CodeSquare, Terminal, Hash, TerminalSquare, Database, Layout } from 'lucide-react';

export const PLATFORMS = {
  leetcode: {
    id: 'leetcode',
    name: 'LeetCode',
    color: '#FFA116',
    icon: Code2,
  },
  codeforces: {
    id: 'codeforces',
    name: 'Codeforces',
    color: '#1890FF',
    icon: CodeSquare,
  },
  github: {
    id: 'github',
    name: 'GitHub',
    color: 'var(--foreground)',
    icon: Github,
  },
  codechef: {
    id: 'codechef',
    name: 'CodeChef',
    color: '#5B4638',
    icon: Terminal,
  },
  geeksforgeeks: {
    id: 'geeksforgeeks',
    name: 'GeeksforGeeks',
    color: '#2F8D46',
    icon: Database,
  },
  hackerrank: {
    id: 'hackerrank',
    name: 'HackerRank',
    color: '#00EA64',
    icon: Hash,
  },
  stackoverflow: {
    id: 'stackoverflow',
    name: 'StackOverflow',
    color: '#F48024',
    icon: TerminalSquare,
  },
  default: {
    id: 'default',
    name: 'Platform',
    color: 'var(--muted)',
    icon: Layout,
  }
};