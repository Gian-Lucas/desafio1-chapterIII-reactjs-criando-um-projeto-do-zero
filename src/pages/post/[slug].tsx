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
import Comments from '../../components/Comments';
import NavigationPost from '../../components/NavigationPost';

interface Post {
  nextPost: { title: string; uid: string } | null;
  prevPost: { title: string; uid: string } | null;
  lastModification: string | null;
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

  const { first_publication_date, lastModification, nextPost, prevPost } = post;
  const { author, banner, content, title } = post.data;

  const estimatedReading =
    content.reduce((quantityWords, contentActual) => {
      const headingWords = contentActual.heading.split(' ').length;
      const bodyWords = RichText.asText(contentActual.body).split(' ').length;

      const totalWords = headingWords + bodyWords;

      return (quantityWords += totalWords);
    }, 0) / 200;

  function formatLastModified(lastModified) {
    const date = format(new Date(lastModified), 'PPp', {
      locale: ptBR,
    }).split(',');

    return `* editado em ${date[0]}, às ${date[1]}`;
  }

  return (
    <>
      <Header />
      <div className={styles.container}>
        <img src={banner.url} alt="banner" />

        <article className={`${commonStyles.container} ${styles.article}`}>
          <h1>{title}</h1>
          <div>
            <ul className={commonStyles.info}>
              <li>
                <FiCalendar />
                <span>
                  {format(new Date(first_publication_date), 'PP', {
                    locale: ptBR,
                  })}
                </span>
              </li>
              <li>
                <FiUser />
                <span>{author}</span>
              </li>
              <li>
                <FiClock />
                <span>{Math.ceil(estimatedReading)} min</span>
              </li>
            </ul>

            {lastModification && (
              <div className={styles.lastModification}>
                {formatLastModified(lastModification)}
              </div>
            )}
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

      <footer className={`${commonStyles.container}`}>
        <NavigationPost nextPost={nextPost} prevPost={prevPost} />
        <Comments />
      </footer>
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

  const nextRes = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    {
      pageSize: 1,
      after: res?.id,
      orderings: '[ document.first_publication_date desc ]',
    }
  );
  const prevRes = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    {
      pageSize: 1,
      after: res?.id,
      orderings: '[ document.first_publication_date ]',
    }
  );

  const nextPost =
    nextRes.results.length === 0
      ? null
      : { title: nextRes.results[0].data.title, uid: nextRes.results[0].uid };
  const prevPost =
    prevRes.results.length === 0
      ? null
      : { title: prevRes.results[0].data.title, uid: prevRes.results[0].uid };

  const content = res.data.content.map(c => {
    return {
      heading: c.heading,
      body: c.body,
    };
  });

  const post = {
    nextPost,
    prevPost,
    uid: res.uid,
    lastModification:
      res.first_publication_date == res.last_publication_date
        ? null
        : res.last_publication_date,
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
