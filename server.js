import { serve } from "https://deno.land/std@0.138.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.138.0/http/file_server.ts";

let previousWord; //前の単語を記録する変数
const historyWord = []; //単語を記録していく配列
const randomWord = ["しりとり", "りんご", "ごりら", "らっこ", "こおり" ,"りす", "すし", "しか", "かに", "にゅーす"]; //ランダムな単語を10個用意
let count = 0; //カウント用変数
let tmp_count; //カウント数保存用変数
let rand_val; //0~9の乱数を格納
const hiragana = /^[\u3040-\u309F]+$/; //ひらがなのunicodeの範囲

console.log("Listening on http://localhost:8000");

serve(async (req) => {
  const pathname = new URL(req.url).pathname;
  console.log(pathname);

  //サーバーに来るリクエストがGET通信であるかどうか判断
  if (req.method === "GET" && pathname === "/shiritori") {
    rand_val = Math.floor(Math.random()*9); //0~9の乱数を生成
    previousWord = randomWord[rand_val];
    return new Response(previousWord); //text形式で返信
  }

  //サーバーに来るリクエストがPOST通信であるかどうか判断
  if (req.method === "POST" && pathname === "/shiritori"){
    const requestJson = await req.json(); //クライアントから送られて来た次の単語をrequestJsonに格納
    const nextWord = requestJson.nextWord;

    //"reset"の文字列が送信されたら
    if(nextWord === "reset"){
      rand_val = Math.floor(Math.random()*9); //0~9の乱数を生成
      previousWord = randomWord[rand_val];
      historyWord.splice(0); //配列の要素を全削除
      return new Response(previousWord);
    }

    historyWord.push(previousWord); //前の単語を記録
    for(let i=0; i<historyWord.length; i++){
      if(historyWord[i] == nextWord){
        break; //記録に同じ単語があったらループを抜ける
      } else {
        count++; //記録に同じ単語がなかったらカウントする
      }
    }
    tmp_count = count; //カウント数を保存する
    count = 0;

    if(nextWord.length === 0){ //単語の文字数が0(入力されていない)だったらエラー
      return new Response("単語を入力してね", { status: 400 });
    } else if(historyWord.length != tmp_count){ //記録の単語数とカウント回数が等しくなかったらエラー
      return new Response("同じ単語は使えないよ", { status: 400 });
    } else if(hiragana.test(nextWord) != true){ //単語にひらがな以外が入力してあったらエラー
      return new Response("ひらがなで入力してね", { status: 400 });
    } else if(nextWord.length > 0 && previousWord.charAt(previousWord.length - 1) !== nextWord.charAt(0)) {
      return new Response("前の単語に続いてないよ", { status: 400 });
    } else if(nextWord.length > 0 && nextWord.charAt(nextWord.length - 1) === 'ん'){ //単語の語に’ん’がついたらエラー
      return new Response("’ん’がついてるよ", { status: 400 });
    }

    previousWord = nextWord;
    return new Response(previousWord); //text形式で返信
  }

  return serveDir(req, {
    fsRoot: "public",
    urlRoot: "",
    showDirListing: true,
    enableCors: true,
  });
});
