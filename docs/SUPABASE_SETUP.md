
# Supabase セットアップ手順

このドキュメントでは、「BEAUTY ROAD スケジュール調整アプリ」でSupabaseをデータベースとして利用するためのセットアップ手順を説明します。

## 1. Supabaseプロジェクトの作成

1.  [Supabase公式サイト](https://supabase.com/)にアクセスし、アカウント登録またはログインします。
2.  ダッシュボードから「New project」をクリックします。
3.  所属するOrganizationを選択（または新規作成）します。
4.  以下の情報を入力します:
    *   **Project name**: 例: `beauty-road-schedule`
    *   **Database Password**: 強力なパスワードを生成・保存します。これは後で直接使うことは少ないですが、安全に保管してください。
    *   **Region**: 最寄りのリージョンを選択します（例: Northeast Asia (Tokyo)）。
    *   **Pricing Plan**: Freeプランで十分開始できます。
5.  「Create new project」をクリックします。プロジェクトの準備が完了するまで数分待ちます。

## 2. テーブルスキーマの定義

プロジェクトの準備ができたら、必要なテーブルを作成します。Supabaseダッシュボードの「SQL Editor」セクション (左メニューのデータベースアイコン -> SQL Editor) から新しいクエリとして以下のスキーマでテーブルを作成するか、GUIの「Table Editor」で各テーブルとカラムを定義します。

### 2.1. `admin_events` テーブル

管理者が作成する日程調整イベントの情報を格納します。

```sql
-- admin_events テーブル作成
CREATE TABLE public.admin_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Row Level Security (RLS) を有効化
ALTER TABLE public.admin_events ENABLE ROW LEVEL SECURITY;

-- ポリシー: 匿名ユーザーでも読み取り可能
CREATE POLICY "Enable read access for anon users"
ON public.admin_events
FOR SELECT
USING (true);

-- ポリシー: 匿名ユーザーでも書き込み可能 (開発用、本番では認証ユーザーに限定推奨)
CREATE POLICY "Enable insert access for anon users"
ON public.admin_events
FOR INSERT
WITH CHECK (true);
```
*   `id`: イベントの一意識別子 (UUID, 主キー, 自動生成)
*   `event_name`: イベント名 (テキスト, NOT NULL)
*   `start_date`: 調整期間の開始日 (日付, NOT NULL)
*   `end_date`: 調整期間の終了日 (日付, NOT NULL)
*   `created_at`: イベント作成日時 (タイムスタンプ(timezone付き), デフォルトは現在時刻, NOT NULL)

### 2.2. `user_entries` テーブル

ユーザーが入力した日程情報を格納します。

```sql
-- user_entries テーブル作成
CREATE TABLE public.user_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.admin_events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  availabilities JSONB NOT NULL, -- DailyAvailability[] の構造をJSONBで保存
  last_updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- event_id カラムにインデックスを追加 (パフォーマンス向上のため)
CREATE INDEX idx_user_entries_event_id ON public.user_entries(event_id);

-- Row Level Security (RLS) を有効化
ALTER TABLE public.user_entries ENABLE ROW LEVEL SECURITY;

-- ポリシー: 匿名ユーザーでも読み取り可能
CREATE POLICY "Enable read access for anon users"
ON public.user_entries
FOR SELECT
USING (true);

-- ポリシー: 匿名ユーザーでも書き込み可能 (開発用、本番では認証ユーザーに限定推奨)
CREATE POLICY "Enable insert access for anon users"
ON public.user_entries
FOR INSERT
WITH CHECK (true);

-- ポリシー: 匿名ユーザーでも更新可能 (開発用、本番ではより厳格な条件推奨)
CREATE POLICY "Enable update access for anon users"
ON public.user_entries
FOR UPDATE
USING (true)
WITH CHECK (true);

-- ポリシー: 匿名ユーザーでも削除可能 (開発用、本番ではより厳格な条件推奨)
CREATE POLICY "Enable delete access for anon users"
ON public.user_entries
FOR DELETE
USING (true);
```
*   `id`: ユーザー入力の一意識別子 (UUID, 主キー, 自動生成)
*   `event_id`: 関連する `admin_events` テーブルのID (UUID, 外部キー, NOT NULL)。`admin_events` のレコードが削除された場合、関連する `user_entries` も削除されます (`ON DELETE CASCADE`)。
*   `name`: 回答者の名前 (テキスト, NOT NULL)
*   `availabilities`: 日ごとの出欠情報 (JSONB, NOT NULL)。TypeScriptの `DailyAvailability[]` 型に相当するJSON構造を格納します。例:
    ```json
    [
      {
        "date": "2024-08-01",
        "slots": [
          { "slotId": "AM", "status": "⚪", "reasons": [] },
          { "slotId": "PM", "status": "△", "reasons": ["一部の時間帯 OK"] }
        ]
      }
    ]
    ```
*   `last_updated_at`: 最終更新日時 (タイムスタンプ(timezone付き), デフォルトは現在時刻, NOT NULL)

**RLS (Row Level Security) ポリシーに関する注意**:
上記で設定したRLSポリシーは、匿名キー（`anon key`）を持つ誰でもデータの読み書き更新削除を許可するものです。これは開発初期段階や内部利用でセキュリティ要件が低い場合には便利ですが、**本番環境や機密情報を扱う場合は、必ず認証済みユーザーのみが操作できるように、より厳格なポリシーを設定してください。** 例えば、`auth.uid() = user_id_column` のような条件を追加して、自分のデータのみ操作できるようにします。

## 3. APIキーとURLの取得

SupabaseプロジェクトのAPIキーとURLは、アプリケーションからSupabaseに接続するために必要です。

1.  Supabaseダッシュボードの左側メニューから「Project Settings」（歯車アイコン）を選択します。
2.  「API」セクションを選択します。
3.  以下の情報を確認・コピーします:
    *   **Project URL**: 「URL」として表示されています。
    *   **Project API Keys**: `anon` (public) キー。サービスロールキー (`service_role key`) はクライアントサイドのアプリケーションでは **絶対に使用しないでください。**

## 4. 環境変数の設定 (Reactアプリケーション側)

取得したURLとAnonキーを、Reactアプリケーションの環境変数として設定します。
もしViteのようなビルドツールを使用している場合、プロジェクトのルートディレクトリに `.env` ファイルを作成（または既存のファイルに追記）し、以下のように記述します。Viteでは環境変数名に `VITE_` プレフィックスが必要です。

```env
VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

`YOUR_SUPABASE_PROJECT_URL` と `YOUR_SUPABASE_ANON_KEY` を、手順3で取得した実際の値に置き換えてください。

**現在のプロジェクト構成の場合**:
現在のプロジェクトはビルドツールを使用せず、`index.html` で直接スクリプトを読み込んでいます。この場合、Supabaseクライアントを初期化する際に、これらの値を直接コードに埋め込むか、グローバルJavaScript変数として設定する必要があります。しかし、**キーを直接コードにコミットするのはセキュリティ上推奨されません。**
ビルドツールを導入し、上記のような `.env` ファイル管理に移行することを強く推奨します。

もし一時的に現在の構成で進める場合は、`index.html` 内の `<script type="module" src="/index.tsx"></script>` の前に、以下のように設定できます（非推奨）:
```html
<script>
  window.SUPABASE_CONFIG = {
    URL: "YOUR_SUPABASE_PROJECT_URL",
    ANON_KEY: "YOUR_SUPABASE_ANON_KEY"
  };
</script>
```
そして `index.tsx` や `scheduleService.ts` で `window.SUPABASE_CONFIG.URL` のようにアクセスします。

## 5. Supabaseクライアントの導入

アプリケーションコード内でSupabaseクライアントを初期化し、データベース操作を行います。
まず、SupabaseのJavaScriptライブラリをプロジェクトに追加します。ビルドツールを使用している場合は `npm install @supabase/supabase-js` または `yarn add @supabase/supabase-js` を実行します。

現在のCDNベースのプロジェクトでは、`index.html` の `<script type="importmap">` に追加するか、別途CDNリンクを追加します。
例 (`importmap`):
```html
<script type="importmap">
{
  "imports": {
    "react-router-dom": "https://esm.sh/react-router-dom@^7.6.2",
    "react-dom/": "https://esm.sh/react-dom@^19.1.0/",
    "react/": "https://esm.sh/react@^19.1.0/",
    "react": "https://esm.sh/react@^19.1.0",
    "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2" // 追加
  }
}
</script>
```

その後、`services/scheduleService.ts` などのファイルでクライアントを初期化します。
```typescript
import { createClient } from '@supabase/supabase-js';

// 環境変数から取得 (ビルドツール導入時)
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// windowオブジェクトから取得 (非推奨の直接設定時)
const supabaseUrl = (window as any).SUPABASE_CONFIG?.URL;
const supabaseAnonKey = (window as any).SUPABASE_CONFIG?.ANON_KEY;


if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// これ以降、scheduleService.ts内のlocalStorageアクセスを
// supabase.from('table_name').select() / .insert() / .update() / .delete()
// といったSupabaseのAPI呼び出しに置き換えていきます。
```

これでSupabaseの基本的なセットアップとクライアント導入の準備は完了です。次に `scheduleService.ts` の各関数をSupabaseの処理に書き換える作業が必要になります。
