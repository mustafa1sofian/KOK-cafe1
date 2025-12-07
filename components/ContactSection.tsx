'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, Mail, MapPin, Clock, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getContactInfo, getWorkingHours, type ContactInfo as FirestoreContactInfo, type WorkingHour as FirestoreWorkingHour } from '@/lib/firestore';

interface ContactInfo extends Omit<FirestoreContactInfo, 'id' | 'updatedAt'> {
  // All properties inherited from FirestoreContactInfo except id and updatedAt
}

interface WorkingHour extends Omit<FirestoreWorkingHour, 'id' | 'updatedAt'> {
  // All properties inherited from FirestoreWorkingHour except id and updatedAt
}

const ContactSection = () => {
  const { t, isRTL, language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactData, setContactData] = useState<ContactInfo>({
    phones: [],
    whatsapps: [],
    emails: [],
    addressEn: '',
    addressAr: ''
  });
  const [workingHoursData, setWorkingHoursData] = useState<WorkingHour[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  // Load data from Firestore
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load contact info
      const contactInfo = await getContactInfo();
      if (contactInfo) {
        setContactData({
          phones: contactInfo.phones,
          whatsapps: contactInfo.whatsapps,
          emails: contactInfo.emails,
          addressEn: contactInfo.addressEn,
          addressAr: contactInfo.addressAr
        });
      }

      // Load working hours
      const workingHours = await getWorkingHours();
      setWorkingHoursData(workingHours.map(hour => ({
        dayEn: hour.dayEn,
        dayAr: hour.dayAr,
        hours: hour.hours,
        order: hour.order
      })));
    } catch (err) {
      console.error('Error loading contact data:', err);
      setError(language === 'ar' ? 'حدث خطأ في تحميل معلومات التواصل' : 'Error loading contact information');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Memoize contact info generation for performance
  const generateContactInfo = useMemo(() => {
    const info = [];

    // Add all phones
    contactData.phones.forEach((phone, index) => {
      info.push({
        icon: Phone,
        label: language === 'ar' ? `هاتف المطعم ${index + 1}` : `Restaurant Phone ${index + 1}`,
        value: phone,
        href: `tel:${phone.replace(/\D/g, '')}`,
        type: 'phone',
        index
      });
    });

    // Add all whatsapps
    contactData.whatsapps.forEach((whatsapp, index) => {
      info.push({
        icon: MessageCircle,
        label: language === 'ar' ? `واتساب ${index + 1}` : `WhatsApp ${index + 1}`,
        value: whatsapp,
        href: `https://wa.me/${whatsapp.replace(/\D/g, '')}`,
        type: 'whatsapp',
        index
      });
    });

    // Add all emails
    contactData.emails.forEach((email, index) => {
      info.push({
        icon: Mail,
        label: language === 'ar' ? `البريد الإلكتروني ${index + 1}` : `Email ${index + 1}`,
        value: email,
        href: `mailto:${email}`,
        type: 'email',
        index
      });
    });

    // Add address
    info.push({
      icon: MapPin,
      label: language === 'ar' ? 'العنوان' : 'Address',
      value: language === 'ar' ? contactData.addressAr : contactData.addressEn,
      href: `https://maps.google.com/?q=${encodeURIComponent(contactData.addressEn)}`,
      type: 'address',
      index: 0
    });

    return info;
  }, [contactData, language]);

  const contactInfo = generateContactInfo;

  return (
    <section ref={sectionRef} id="contact" className="py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-4 ${isRTL ? 'font-arabic' : 'font-english'
            }`}>
            {t('contactTitle')}
          </h2>
          <p className={`text-gray-500 text-base max-w-2xl mx-auto px-4 leading-relaxed ${isRTL ? 'font-arabic' : 'font-english'
            }`}>
            {language === 'ar'
              ? 'تواصل معنا أو قم بزيارتنا'
              : 'Contact us or visit us'
            }
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-black" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-10 md:gap-16 max-w-6xl mx-auto items-start">

            {/* Left Col: Info & Social */}
            <div className={`space-y-10 ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-700`}>

              {/* Contact List */}
              <div className="space-y-6">
                {contactInfo.map((info, i) => (
                  <div key={i} className={`flex items-start space-x-4 rtl:space-x-reverse ${isRTL ? 'text-right' : 'text-left'}`}>
                    <div className="mt-1 w-9 h-9 rounded-lg bg-gradient-to-br from-blue-400/10 to-blue-500/10 flex items-center justify-center">
                      <info.icon className="w-5 h-5 text-blue-700" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold text-gray-900 uppercase tracking-wide mb-1 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                        {info.label}
                      </h4>
                      <a
                        href={info.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-lg text-gray-600 hover:text-black transition-colors ${isRTL ? 'font-arabic' : 'font-english'}`}
                      >
                        {info.value}
                      </a>
                    </div>
                  </div>
                ))}

                {/* Working Hours (Simplified) */}
                <div className={`flex items-start space-x-4 rtl:space-x-reverse ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div className="mt-1 w-9 h-9 rounded-lg bg-gradient-to-br from-blue-400/10 to-blue-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-700" strokeWidth={1.5} />
                  </div>
                  <div className="w-full">
                    <h4 className={`text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 ${isRTL ? 'font-arabic' : 'font-english'}`}>
                      {language === 'ar' ? 'ساعات العمل' : 'Working Hours'}
                    </h4>
                    <div className="space-y-1">
                      {workingHoursData.map((sch, idx) => (
                        <div key={idx} className="flex justify-between text-gray-600 text-sm border-b border-gray-100 last:border-0 py-1">
                          <span className={isRTL ? 'font-arabic' : 'font-english'}>{language === 'ar' ? sch.dayAr : sch.dayEn}</span>
                          <span className="font-medium" dir="ltr">{sch.hours}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media Row */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className={`text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 ${isRTL ? 'text-right font-arabic' : 'text-left font-english'}`}>
                  {language === 'ar' ? 'تابعنا على' : 'Follow Us'}
                </h4>
                <div className="flex gap-4 justify-start">
                  {/* Snapchat */}
                  <a href="https://www.snapchat.com/@kokiyan.cuisine?locale=ar" className="w-10 h-10 rounded-full bg-gray-50 hover:bg-blue-500 flex items-center justify-center transition-colors group">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" className="text-gray-900 group-hover:text-white">
                      <path fill="currentColor" d="M30.893,22.837c-.208-.567-.606-.871-1.058-1.122-.085-.05-.163-.09-.23-.12-.135-.07-.273-.137-.41-.208-1.41-.747-2.51-1.69-3.274-2.808-.217-.315-.405-.648-.562-.996-.065-.186-.062-.292-.015-.389,.046-.074,.108-.138,.18-.188,.242-.16,.492-.323,.661-.432,.302-.195,.541-.35,.695-.46,.579-.405,.983-.835,1.236-1.315,.357-.672,.404-1.466,.13-2.175-.383-1.009-1.336-1.635-2.49-1.635-.243,0-.486,.025-.724,.077-.064,.014-.127,.028-.189,.044,.011-.69-.005-1.418-.066-2.135-.218-2.519-1.1-3.84-2.02-4.893-.589-.66-1.283-1.218-2.053-1.653-1.396-.797-2.979-1.202-4.704-1.202s-3.301,.405-4.698,1.202c-.773,.434-1.468,.994-2.057,1.656-.92,1.053-1.802,2.376-2.02,4.893-.061,.717-.077,1.449-.067,2.135-.062-.016-.125-.031-.189-.044-.238-.051-.481-.077-.724-.077-1.155,0-2.109,.626-2.491,1.635-.276,.71-.23,1.505,.126,2.178,.254,.481,.658,.911,1.237,1.315,.153,.107,.393,.262,.695,.46,.163,.106,.402,.261,.635,.415,.082,.053,.151,.123,.204,.205,.049,.1,.051,.208-.022,.408-.155,.341-.34,.668-.553,.976-.747,1.092-1.815,2.018-3.179,2.759-.723,.383-1.474,.639-1.791,1.502-.239,.651-.083,1.391,.525,2.015h0c.223,.233,.482,.429,.766,.58,.592,.326,1.222,.578,1.876,.75,.135,.035,.263,.092,.379,.169,.222,.194,.19,.486,.485,.914,.148,.221,.336,.412,.555,.564,.619,.428,1.315,.455,2.053,.483,.666,.025,1.421,.054,2.283,.339,.357,.118,.728,.346,1.158,.613,1.032,.635,2.446,1.503,4.811,1.503s3.789-.873,4.829-1.51c.427-.262,.796-.488,1.143-.603,.862-.285,1.617-.313,2.283-.339,.737-.028,1.433-.055,2.053-.483,.259-.181,.475-.416,.632-.69,.212-.361,.207-.613,.406-.789,.109-.074,.229-.129,.356-.162,.662-.173,1.301-.428,1.901-.757,.302-.162,.575-.375,.805-.63l.008-.009c.57-.61,.714-1.329,.48-1.964Zm-2.102,1.13c-1.282,.708-2.135,.632-2.798,1.059-.563,.363-.23,1.144-.639,1.426-.503,.347-1.989-.025-3.909,.609-1.584,.524-2.594,2.029-5.442,2.029s-3.835-1.502-5.444-2.033c-1.916-.634-3.406-.262-3.909-.609-.409-.282-.077-1.064-.639-1.426-.664-.427-1.516-.351-2.798-1.055-.816-.451-.353-.73-.081-.862,4.645-2.249,5.386-5.721,5.419-5.979,.04-.312,.084-.557-.259-.875-.332-.307-1.804-1.218-2.213-1.503-.676-.472-.973-.944-.754-1.523,.153-.401,.527-.552,.92-.552,.124,0,.248,.014,.369,.041,.742,.161,1.462,.533,1.879,.633,.05,.013,.102,.02,.153,.021,.222,0,.3-.112,.285-.366-.048-.812-.162-2.394-.034-3.872,.176-2.034,.831-3.042,1.61-3.934,.374-.428,2.132-2.286,5.493-2.286s5.123,1.85,5.497,2.276c.78,.891,1.436,1.899,1.61,3.934,.128,1.479,.018,3.061-.034,3.872-.018,.268,.063,.366,.285,.366,.052,0,.103-.008,.153-.021,.417-.1,1.137-.472,1.879-.633,.121-.027,.245-.041,.369-.041,.395,0,.766,.153,.92,.552,.219,.579-.077,1.051-.753,1.523-.409,.285-1.881,1.196-2.213,1.503-.344,.317-.299,.563-.259,.875,.033,.261,.773,3.734,5.419,5.979,.274,.137,.737,.416-.079,.871Z" />
                    </svg>
                  </a>

                  {/* Instagram */}
                  <a href="https://www.instagram.com/kokiyan.cuisine?igsh=MW81dXBmN3BjdGV3eQ==" className="w-10 h-10 rounded-full bg-gray-50 hover:bg-pink-600 flex items-center justify-center transition-colors group">
                    {/* Lucide Instagram icon is usually imported, but using SVG for consistency/safety if import missing */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900 group-hover:text-white">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </a>

                  {/* WhatsApp */}
                  <a href="http://wa.me//966558121096" className="w-10 h-10 rounded-full bg-gray-50 hover:bg-green-500 flex items-center justify-center transition-colors group">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" className="text-gray-900 group-hover:text-white">
                      <path fill="currentColor" fillRule="evenodd" d="M25.873,6.069c-2.619-2.623-6.103-4.067-9.814-4.069C8.411,2,2.186,8.224,2.184,15.874c-.001,2.446,.638,4.833,1.852,6.936l-1.969,7.19,7.355-1.929c2.026,1.106,4.308,1.688,6.63,1.689h.006c7.647,0,13.872-6.224,13.874-13.874,.001-3.708-1.44-7.193-4.06-9.815h0Zm-9.814,21.347h-.005c-2.069,0-4.099-.557-5.87-1.607l-.421-.25-4.365,1.145,1.165-4.256-.274-.436c-1.154-1.836-1.764-3.958-1.763-6.137,.003-6.358,5.176-11.531,11.537-11.531,3.08,.001,5.975,1.202,8.153,3.382,2.177,2.179,3.376,5.077,3.374,8.158-.003,6.359-5.176,11.532-11.532,11.532h0Zm6.325-8.636c-.347-.174-2.051-1.012-2.369-1.128-.318-.116-.549-.174-.78,.174-.231,.347-.895,1.128-1.098,1.359-.202,.232-.405,.26-.751,.086-.347-.174-1.464-.54-2.788-1.72-1.03-.919-1.726-2.054-1.929-2.402-.202-.347-.021-.535,.152-.707,.156-.156,.347-.405,.52-.607,.174-.202,.231-.347,.347-.578,.116-.232,.058-.434-.029-.607-.087-.174-.78-1.88-1.069-2.574-.281-.676-.567-.584-.78-.595-.202-.01-.433-.012-.665-.012s-.607,.086-.925,.434c-.318,.347-1.213,1.186-1.213,2.892s1.242,3.355,1.416,3.587c.174,.232,2.445,3.733,5.922,5.235,.827,.357,1.473,.571,1.977,.73,.83,.264,1.586,.227,2.183,.138,.666-.1,2.051-.839,2.34-1.649,.289-.81,.289-1.504,.202-1.649s-.318-.232-.665-.405h0Z" />
                    </svg>
                  </a>
                </div>
              </div>

            </div>

            {/* Right Col: Map (Clean) */}
            <div className={`h-full min-h-[400px] rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-gray-50 ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-700 delay-200`}>
              {contactData.addressEn ? (
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3711.8234567890123!2d39.12345678901234!3d21.54321098765432!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x15c1630c2f552b63%3A0x218cbb5e07f21275!2z2YXYt9i52YUg2Ygg2YPYp9mB2YrZhyDZg9mI2YPZitin2YY!5e0!3m2!1sar!2ssa!4v1234567890123"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  title="location"
                  className="transition-all duration-500"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <MapPin className="w-10 h-10 opacity-20" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ContactSection;