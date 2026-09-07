import React from 'react';
import { createRoot } from 'react-dom/client';
import Studio from './app/page';
import Overlay from './app/overlay';
import './app/globals.css';
const overlay=['/overlay','/capture'].includes(location.pathname.replace(/\/$/,''));
document.documentElement.className=overlay?'overlay-page':'dark';
createRoot(document.getElementById('root')!).render(overlay?<Overlay/>:<Studio/>);
