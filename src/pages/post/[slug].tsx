import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useRouter } from 'next/router';

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
  const router = useRouter();

  if (router.isFallback) {
    return <h2>Carregando...</h2>;
  }

  const { first_publication_date } = post;
  const { author, banner, content, title } = post.data;

  const estimatedReading =
    content.reduce((quantityWords, contentActual) => {
      const headingWords = contentActual.heading.split(' ').length;
      const bodyWords = RichText.asText(contentActual.body).split(' ').length;

      const totalWords = headingWords + bodyWords;

      return (quantityWords += totalWords);
    }, 0) / 200;

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
              <span>
                {format(new Date(first_publication_date), 'PP', {
                  locale: ptBR,
                })}
              </span>
            </div>
            <div>
              <FiUser />
              <span>{author}</span>
            </div>
            <div>
              <FiClock />
              <span>{Math.ceil(estimatedReading)} min</span>
            </div>
          </div>

          <div className={styles.content}>
            {content.map(cont => {
              return (
                <div className={styles.paragraph} key={cont.heading}>
                  <h2>{cont.heading}</h2>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(cont.body),
                    }}
                  />
                </div>
              );
            })}
          </div>
        </article>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    { pageSize: 2 }
  );

  const { results } = posts;

  const postsSlugs = results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths: postsSlugs,
    fallback: true, // false or true
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;

  const res = await prismic.getByUID('post', String(slug), {});

  const content = res.data.content.map(c => {
    return {
      heading: c.heading,
      body: c.body,
    };
  });

  const post = {
    uid: res.uid,
    first_publication_date: res.first_publication_date,
    data: {
      title: res.data.title,
      subtitle: res.data.subtitle,
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
