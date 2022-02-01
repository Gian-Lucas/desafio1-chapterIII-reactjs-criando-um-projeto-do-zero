import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const { first_publication_date } = post;
  const { author, banner, content, title } = post.data;

  console.log(content);
  return (
    <>
      <Header />
      <div className={styles.container}>
        <img src={banner.url} alt="banner" />

        <article className={`${commonStyles.container} ${styles.article}`}>
          <h1>{title}</h1>
          <div className={commonStyles.info}>
            <div>
              <FiCalendar />
              <span>{first_publication_date}</span>
            </div>
            <div>
              <FiUser />
              <span>{author}</span>
            </div>
            <div>
              <FiClock />
              <span>5 min</span>
            </div>
          </div>

          <div className={styles.content}>
            {content.map(cont => {
              return (
                <div className={styles.paragraph}>
                  <h2>{cont.heading}</h2>
                  {cont.body.map(text => (
                    <p>{text}</p>
                  ))}
                </div>
              );
            })}
          </div>
        </article>
      </div>
    </>
  );
}

export const getStaticPaths = async () => {
  //   const prismic = getPrismicClient();
  //   const posts = await prismic.query(TODO);

  return {
    paths: [],
    fallback: 'blocking', // false or true
  };

  //   // TODO
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;

  const res = await prismic.getByUID('post', String(slug), {});

  const content = res.data.content.map(c => {
    return {
      heading: c.heading,
      body: c.body.map(t => {
        return t.text;
      }),
    };
  });

  const post = {
    first_publication_date: format(new Date(res.first_publication_date), 'PP', {
      locale: ptBR,
    }),
    data: {
      title: res.data.title,
      banner: {
        url: res.data.banner.url,
      },
      author: res.data.author,
      content,
    },
  };

  return {
    props: {
      post,
    },
  };
};
